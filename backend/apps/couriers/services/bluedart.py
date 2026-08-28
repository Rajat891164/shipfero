import requests
from datetime import datetime, timedelta

from django.conf import settings
from django.utils import timezone

from apps.couriers.models import CarrierCredential
from .base import BaseCourierService


class BlueDartService(BaseCourierService):
    """
    Blue Dart Courier Service
    """

    TOKEN_VALIDITY_MINUTES = 25
    REQUEST_TIMEOUT = 30

    def __init__(self, merchant_courier):
        super().__init__(merchant_courier)

        self.system_credentials = CarrierCredential.objects.get(
            carrier=self.carrier,
            is_active=True,
        )

        self.session = requests.Session()

    # ==========================================================
    # Helpers
    # ==========================================================

    def _get_base_url(self):
        """
        Returns Sandbox or Production URL.
        """

        if getattr(settings, "BLUEDART_SANDBOX", True):
            return self.system_credentials.sandbox_url

        return self.system_credentials.production_url

    # ==========================================================
    # Authentication
    # ==========================================================

    def authenticate(self):
        """
        Returns a valid JWT token.
        """

        # Return cached token if valid
        if (
            self.system_credentials.access_token
            and self.system_credentials.token_expiry
            and self.system_credentials.token_expiry > timezone.now()
        ):
            return self.system_credentials.access_token

        url = (
            f"{self._get_base_url()}"
            "/in/transportation/token/v1/login"
        )

        headers = {
            "clientId": self.system_credentials.client_id,
            "clientSecret": self.system_credentials.client_secret,
        }

        try:
            response = self.session.get(
                url,
                headers=headers,
                timeout=self.REQUEST_TIMEOUT,
            )

            response.raise_for_status()

            data = response.json()

            token = data.get("JWTToken")

            if not token:
                raise Exception("JWTToken not found in Blue Dart response.")

            self.system_credentials.access_token = token
            self.system_credentials.token_expiry = (
                timezone.now()
                + timedelta(minutes=self.TOKEN_VALIDITY_MINUTES)
            )

            self.system_credentials.save(
                update_fields=[
                    "access_token",
                    "token_expiry",
                ]
            )

            return token

        except requests.Timeout:
            raise Exception("Blue Dart request timed out.")

        except requests.ConnectionError:
            raise Exception("Unable to connect to Blue Dart.")

        except requests.HTTPError as e:
            raise Exception(f"Blue Dart HTTP Error: {e}")

        except Exception as e:
            raise Exception(str(e))

    # ==========================================================
    # Common API Request
    # ==========================================================

    def request(
        self,
        method,
        endpoint,
        payload=None,
        params=None,
        retry=True,
    ):
        """
        Common request method for all Blue Dart APIs.
        Automatically refreshes JWT if expired.
        """

        token = self.authenticate()

        headers = {
            "JWTToken": token,
            "Content-Type": "application/json",
        }

        url = f"{self._get_base_url()}{endpoint}"

        response = self.session.request(
            method=method,
            url=url,
            headers=headers,
            json=payload,
            params=params,
            timeout=self.REQUEST_TIMEOUT,
        )

        # Refresh token once if unauthorized
        if response.status_code == 401 and retry:

            self.system_credentials.access_token = None
            self.system_credentials.token_expiry = None

            self.system_credentials.save(
                update_fields=[
                    "access_token",
                    "token_expiry",
                ]
            )

            return self.request(
                method=method,
                endpoint=endpoint,
                payload=payload,
                params=params,
                retry=False,
            )

        if not response.ok:
            try:
                error_body = response.json()
            except ValueError:
                error_body = response.text

            print("=== BLUE DART HTTP ERROR ===")
            print("STATUS:", response.status_code)
            print("URL:", response.url)
            print("RESPONSE:", error_body)
            print("=== END BLUE DART HTTP ERROR ===")

            raise Exception(
                f"Blue Dart API error ({response.status_code}): {error_body}"
            )

        if response.content:
            return response.json()

        return {}

    # ==========================================================
    # Shipment APIs
    # ==========================================================

    BLUEDART_SERVICE_MAP = {
        "Apex FOD": {"product_code": "A", "sub_product_code": "A", "pack_type": ""},
        "Apex DODFOD": {"product_code": "A", "sub_product_code": "B", "pack_type": ""},
        "Dart Plus COD": {"product_code": "A", "sub_product_code": "C", "pack_type": "L"},
        "Ecom-AIR_COD": {"product_code": "A", "sub_product_code": "C", "pack_type": ""},
        "Apex COD": {"product_code": "A", "sub_product_code": "C", "pack_type": ""},
        "Apex DOD": {"product_code": "A", "sub_product_code": "D", "pack_type": ""},
        "Apex LITE": {"product_code": "A", "sub_product_code": "E", "pack_type": ""},
        "Dart Plus Prepaid": {"product_code": "A", "sub_product_code": "P", "pack_type": "L"},
        "Ecom-AIR_Prepaid": {"product_code": "A", "sub_product_code": "P", "pack_type": ""},
        "Apex Prepaid": {"product_code": "A", "sub_product_code": "P", "pack_type": ""},
        "Dart Apex": {"product_code": "A", "sub_product_code": "", "pack_type": ""},
        "Apex TDD": {"product_code": "A", "sub_product_code": "", "pack_type": "T"},
        "Domestic Priority": {"product_code": "D", "sub_product_code": "", "pack_type": ""},
        "Express FOD": {"product_code": "E", "sub_product_code": "A", "pack_type": ""},
        "Express DODFOD": {"product_code": "E", "sub_product_code": "B", "pack_type": ""},
        "Express COD": {"product_code": "E", "sub_product_code": "C", "pack_type": ""},
        "Express DOD": {"product_code": "E", "sub_product_code": "D", "pack_type": ""},
        "Dart SFC Line": {"product_code": "E", "sub_product_code": "", "pack_type": ""},
    }

    @staticmethod
    def _build_credit_reference(shipment):
        """
        Build a Blue Dart CreditReferenceNo that is always <= 20 characters.
        Prefer the order ID, then shipment ID, and keep the ORD- prefix used
        by the existing booking flow.
        """
        order_id = getattr(shipment, "order_id", None)
        shipment_id = getattr(shipment, "id", None)

        raw_id = str(order_id or shipment_id or "SHIPMENT").strip()
        reference = f"ORD-{raw_id}"

        return reference[:20]

    def _get_service_codes(self, shipment):
        default_service = str(
            self.config.get_credential("default_service", "")
            or ""
        ).strip()

        if default_service == "Dart Plus":
            payment_mode = str(
                getattr(shipment, "payment_mode", "")
                or ""
            ).upper()

            if "COD" in payment_mode:
                return {
                    "product_code": "A",
                    "sub_product_code": "C",
                    "pack_type": "L",
                }

            return {
                "product_code": "A",
                "sub_product_code": "P",
                "pack_type": "L",
            }

        service_codes = self.BLUEDART_SERVICE_MAP.get(default_service)

        if not service_codes:
            raise ValueError(
                f"Unsupported Blue Dart service '{default_service}'. "
                "Please select a valid Blue Dart service in Courier Settings."
            )

        return service_codes

    def create_shipment(self, shipment):
        """
        Book shipment on Blue Dart and return response.
        """

        credentials = self.config.credentials

        def g(key, default=""):
            return self.config.get_credential(key, default)

        clean_phone = "".join(filter(str.isdigit, shipment.consignee_phone or ""))[-10:]

        if len(clean_phone) != 10:
            clean_phone = "9999999999"

        unique_ref = str(self._build_credit_reference(shipment))[:20]
        service_codes = self._get_service_codes(shipment)


        payload = {
            "Request": {
                "Consignee": {
                    "ConsigneeName": shipment.consignee_name,
                    "ConsigneeAddress1": shipment.consignee_address1,
                    "ConsigneeAddress2": shipment.consignee_address2 or "",
                    "ConsigneeAddress3": getattr(shipment, "consignee_address3", "") or "",
                    "ConsigneePincode": shipment.consignee_pincode,
                    "ConsigneeMobile": clean_phone,
                    "ConsigneeTelephone": clean_phone,
                    "ConsigneeEmailID": "",
                    "ConsigneeAttention": "",
                    "ConsigneeAddressType": "",
                    "ConsigneeAddressinfo": "",
                    "ConsigneeFullAddress": "",
                    "ConsigneeGSTNumber": "",
                    "ConsigneeLatitude": "",
                    "ConsigneeLongitude": "",
                    "ConsigneeMaskedContactNumber": clean_phone,
                    "AvailableDays": "",
                    "AvailableTiming": "",
                },

                "Returnadds": {
                    "ReturnAddress1": g("shipper_address"),
                    "ReturnAddress2": "",
                    "ReturnAddress3": "",
                    "ReturnPincode": g("shipper_pincode"),
                    "ReturnMobile": g("shipper_mobile"),
                    "ReturnContact": g("shipper_name"),
                    "ReturnEmailID": "",
                    "ReturnAddressinfo": "",
                    "ReturnLatitude": "",
                    "ReturnLongitude": "",
                    "ReturnMaskedContactNumber": "",
                    "ReturnTelephone": "",
                    "ManifestNumber": "",
                },

                "Services": {
                    "AWBNo": "",
                    "ActualWeight": str(shipment.weight),
                    "CollectableAmount": float(shipment.cod_amount or 0),
                    "DeclaredValue": float(shipment.declared_value),
                    "ProductCode": service_codes["product_code"],
                    "SubProductCode": service_codes["sub_product_code"],
                    "PackType": service_codes["pack_type"],
                    "ProductType": 1,
                    "PieceCount": str(shipment.product_quantity),
                    "ItemCount": 1,
                    "CreditReferenceNo": unique_ref,
                    "CreditReferenceNo2": str(getattr(shipment, "order_id", "") or getattr(shipment, "id", ""))[:20],
                    "CreditReferenceNo3": "",
                    "CurrencyCode": "INR",
                    "PDFOutputNotRequired": False,
                    "Dimensions": [
                        {
                            "Breadth": 10,
                            "Height": 10,
                            "Length": 10,
                            "Count": 1,
                        }
                    ],
                    "Commodity": {
                        "CommodityDetail1": shipment.product_name or "",
                        "CommodityDetail2": "",
                        "CommodityDetail3": "",
                    },
                    "PickupDate": f"/Date({int(datetime.now().timestamp()*1000)})/",
                    "PickupTime": "1300",
                    "RegisterPickup": False,
                    "IsReversePickup": False,
                    "IsForcePickup": False,
                    "OTPBasedDelivery": "0",
                    "SpecialInstruction": getattr(shipment, "special_instruction", "") or "",
                    "itemdtl": [
                        {
                            "ItemID": "1",
                            "ItemName": shipment.product_name or "",
                            "ItemValue": float(shipment.declared_value),
                            "Itemquantity": 1,
                            "TotalValue": float(shipment.declared_value),
                            "TaxableAmount": 0,
                            "CGSTAmount": 0,
                            "SGSTAmount": 0,
                            "IGSTAmount": 0,
                            "IGSTRate": 0,
                            "HSCode": getattr(shipment, "hs_code", None) or getattr(shipment, "hsn_code", "") or "",
                            "InvoiceNumber": getattr(shipment, "invoice_no", "") or "",
                            "InvoiceDate": f"/Date({int(datetime.now().timestamp()*1000)})/",
                            "PlaceofSupply": shipment.consignee_state,
                            "SellerName": g("shipper_name"),
                            "SellerGSTNNumber": "",
                            "countryOfOrigin": "IN",
                            "docType": "INV",
                            "subSupplyType": 1,
                            "supplyType": "0",
                        }
                    ],
                },

                "Shipper": {
                    "CustomerName": g("shipper_name"),
                    "CustomerAddress1": g("shipper_address"),
                    "CustomerAddress2": "",
                    "CustomerAddress3": "",
                    "CustomerPincode": g("shipper_pincode"),
                    "CustomerMobile": g("shipper_mobile"),
                    "CustomerTelephone": "",
                    "CustomerEmailID": "",
                    "CustomerCode": g("customer_code"),
                    "OriginArea": g("origin_area"),
                    "Sender": "",
                    "VendorCode": "",
                    "CustomerGSTNumber": "",
                    "CustomerLatitude": "",
                    "CustomerLongitude": "",
                    "CustomerAddressinfo": "",
                    "CustomerMaskedContactNumber": "",
                    "IsToPayCustomer": False,
                },
            },

            "Profile": {
                "LoginID": g("login_id"),
                "LicenceKey": g("license_key"),
                "Api_type": "S",
                "ProfileName": g("shipper_name", "GENERAL"),
            },
        }

        response = self.request(
            method="POST",
            endpoint="/in/transportation/waybill/v1/GenerateWayBill",
            payload=payload,
        )

        # Normalize AWB from top-level or nested Blue Dart response.
        def find_awb(value):
            if isinstance(value, dict):
                for key in (
                    "AWBNo", "AWBNO", "AWBNumber", "awb", "awb_number",
                    "awbNo", "WaybillNo", "WayBillNo", "WaybillNumber",
                ):
                    candidate = value.get(key)
                    if candidate is not None:
                        candidate = str(candidate).strip()
                        if candidate and candidate not in ("0", "None", "null"):
                            return candidate
                for key in (
                    "GenerateWayBillResult", "GenerateWayBillResponse",
                    "Result", "result", "Response", "response",
                ):
                    if key in value:
                        found = find_awb(value[key])
                        if found:
                            return found
                for nested in value.values():
                    found = find_awb(nested)
                    if found:
                        return found
            elif isinstance(value, list):
                for item in value:
                    found = find_awb(item)
                    if found:
                        return found
            return None

        if isinstance(response, dict):
            awb = find_awb(response)
            print("=== BLUE DART BOOKING RESPONSE ===")
            print("RESPONSE:", response)
            print("EXTRACTED AWB:", awb)
            print("=== END BLUE DART BOOKING RESPONSE ===")
            if awb:
                response["AWBNo"] = awb
                response["awb"] = awb
                response["awb_number"] = awb

        return response

    def cancel_shipment(self, awb_number):
        raise NotImplementedError("Shipment cancellation not implemented.")

    def track_shipment(self, awb_number):
        raise NotImplementedError("Shipment tracking not implemented.")

    def generate_label(self, awb_number):
        raise NotImplementedError("Label generation not implemented.")

    def create_pickup(self, pickup_data):
        raise NotImplementedError("Pickup creation not implemented.")

    # ==========================================================
    # Connection Test
    # ==========================================================

    def test_connection(self):
        """
        Test Blue Dart authentication.
        """

        try:
            self.authenticate()
            return True, "Authentication Successful"

        except Exception as e:
            return False, str(e)