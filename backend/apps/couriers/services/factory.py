from apps.couriers.services.bluedart import BlueDartService


class CourierFactory:
    """
    Factory responsible for returning the correct courier service.

    Example:
        service = CourierFactory.get_service(merchant_courier)
        service.create_shipment(payload)
    """

    SERVICES = {
        "BLUEDART": BlueDartService,
        # "DELHIVERY": DelhiveryService,
        # "DTDC": DTDCService,
        # "XPRESSBEES": XpressBeesService,
    }

    @classmethod
    def get_service(cls, merchant_courier):
        """
        Returns the appropriate courier service instance.

        Args:
            merchant_courier: MerchantCourier model instance

        Returns:
            BaseCourierService
        """

        carrier_code = merchant_courier.carrier.code.upper()

        service_class = cls.SERVICES.get(carrier_code)

        if not service_class:
            raise ValueError(
                f"Courier '{carrier_code}' is not supported."
            )

        return service_class(merchant_courier)