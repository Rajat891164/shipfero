import uuid
from django.db import models
from django.db import transaction

from core.models import TimeStampedModel
from apps.merchants.models import Merchant


class Wallet(TimeStampedModel):
    """One wallet per merchant."""

    merchant = models.OneToOneField(
        Merchant,
        on_delete=models.CASCADE,
        related_name="wallet",
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Wallet – {self.merchant.company_name} | ₹{self.balance}"

    def credit(self, amount, description="", reference="", txn_type="RECHARGE"):
        """Credit amount to wallet atomically."""
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            wallet.balance += amount
            wallet.save(update_fields=["balance"])
            WalletTransaction.objects.create(
                wallet=wallet,
                txn_type=txn_type,
                amount=amount,
                closing_balance=wallet.balance,
                description=description,
                reference=reference,
            )
            self.balance = wallet.balance

    def debit(self, amount, description="", reference="", txn_type="DEDUCTION"):
        """Debit amount from wallet atomically."""
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(pk=self.pk)
            if wallet.balance < amount:
                raise ValueError("Insufficient wallet balance.")
            wallet.balance -= amount
            wallet.save(update_fields=["balance"])
            WalletTransaction.objects.create(
                wallet=wallet,
                txn_type=txn_type,
                amount=amount,
                closing_balance=wallet.balance,
                description=description,
                reference=reference,
            )
            self.balance = wallet.balance


class WalletTransaction(TimeStampedModel):
    """Individual debit/credit transactions for a wallet."""

    class TransactionType(models.TextChoices):
        RECHARGE = "RECHARGE", "Recharge"
        DEDUCTION = "DEDUCTION", "Shipping Deduction"
        COD_CREDIT = "COD_CREDIT", "COD Credit"
        REFUND = "REFUND", "Refund"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        REVERSAL = "REVERSAL", "Reversal"
        PLAN_PAYMENT = "PLAN_PAYMENT", "Plan Payment"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REVERSED = "REVERSED", "Reversed"

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
    )

    txn_id = models.CharField(max_length=50, unique=True, db_index=True)
    txn_type = models.CharField(max_length=20, choices=TransactionType.choices)

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=14, decimal_places=2)

    description = models.CharField(max_length=255, null=True, blank=True)
    reference = models.CharField(max_length=255, null=True, blank=True)  # Shipment ID, Invoice ID etc.

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUCCESS,
    )

    # Payment gateway fields (for recharge)
    gateway = models.CharField(max_length=50, null=True, blank=True)
    gateway_txn_id = models.CharField(max_length=255, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.txn_id:
            self.txn_id = f"TXN{uuid.uuid4().hex[:14].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.txn_id} | {self.txn_type} | ₹{self.amount}"

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["wallet", "txn_type"]),
            models.Index(fields=["wallet", "created_at"]),
        ]


class Invoice(TimeStampedModel):
    """Monthly invoice for merchant."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ISSUED = "ISSUED", "Issued"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELLED = "CANCELLED", "Cancelled"

    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="invoices",
    )

    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField()
    due_date = models.DateField()

    # Amounts
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    pdf_url = models.URLField(max_length=1000, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from django.utils import timezone
            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} – {self.merchant.company_name} | ₹{self.total_amount}"

    class Meta:
        ordering = ["-invoice_date"]
