from django.db import models
from core.models import TimeStampedModel
from apps.carriers.models import Carrier


class PricingZone(TimeStampedModel):
    """Zone definitions for pricing (A, B, C, D, E)."""

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Zone {self.code} - {self.name}"


class RateCard(TimeStampedModel):
    """Detailed rate card per courier, per zone, per weight slab."""

    class WeightSlab(models.TextChoices):
        KG_0_5 = "0.5", "0 - 0.5 kg"
        KG_1_0 = "1.0", "0.5 - 1.0 kg"
        KG_2_0 = "2.0", "1.0 - 2.0 kg"
        KG_5_0 = "5.0", "2.0 - 5.0 kg"
        KG_10_0 = "10.0", "5.0 - 10.0 kg"
        ADDITIONAL = "ADDITIONAL", "Additional 0.5kg"

    carrier = models.ForeignKey(
        Carrier, on_delete=models.CASCADE, related_name="rate_cards"
    )
    zone = models.ForeignKey(
        PricingZone, on_delete=models.CASCADE, related_name="rate_cards"
    )
    service_type = models.CharField(max_length=50, default="STANDARD")
    
    weight_slab = models.CharField(max_length=20, choices=WeightSlab.choices)
    
    # Rates
    forward_charge = models.DecimalField(max_digits=10, decimal_places=2)
    rto_charge = models.DecimalField(max_digits=10, decimal_places=2)
    
    # COD
    cod_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cod_min_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Extra
    fuel_surcharge_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.carrier.name} | Zone {self.zone.code} | {self.weight_slab}kg"

    class Meta:
        unique_together = [("carrier", "zone", "service_type", "weight_slab")]
        ordering = ["carrier__name", "zone__code"]
