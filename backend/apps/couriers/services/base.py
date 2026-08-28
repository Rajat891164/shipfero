from abc import ABC, abstractmethod


class BaseCourierService(ABC):
    """
    Base class for all courier integrations.

    Every courier service must implement these methods.
    """

    def __init__(self, merchant_courier):
        self.config = merchant_courier
        self.carrier = merchant_courier.carrier
        self.credentials = merchant_courier.credentials or {}

    # -----------------------------------------------------
    # Authentication
    # -----------------------------------------------------

    @abstractmethod
    def authenticate(self):
        """
        Authenticate with courier API.

        Returns:
            dict
        """
        pass

    # -----------------------------------------------------
    # Shipment
    # -----------------------------------------------------

    @abstractmethod
    def create_shipment(self, shipment_data):
        """
        Book a shipment.

        Returns:
            dict
        """
        pass

    @abstractmethod
    def cancel_shipment(self, awb_number):
        """
        Cancel a shipment.

        Returns:
            dict
        """
        pass

    # -----------------------------------------------------
    # Tracking
    # -----------------------------------------------------

    @abstractmethod
    def track_shipment(self, awb_number):
        """
        Track shipment.

        Returns:
            dict
        """
        pass

    # -----------------------------------------------------
    # Label
    # -----------------------------------------------------

    @abstractmethod
    def generate_label(self, awb_number):
        """
        Generate shipping label.

        Returns:
            bytes | url
        """
        pass

    # -----------------------------------------------------
    # Pickup
    # -----------------------------------------------------

    @abstractmethod
    def create_pickup(self, pickup_data):
        """
        Schedule pickup.

        Returns:
            dict
        """
        pass

    # -----------------------------------------------------
    # Health Check
    # -----------------------------------------------------

    @abstractmethod
    def test_connection(self):
        """
        Verify merchant configuration.

        Returns:
            tuple(bool, str)
        """
        pass