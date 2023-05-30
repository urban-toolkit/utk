class InvalidPolygon(ValueError):
    """Exception for invalid polygon."""

    def __init__(self, *args, **kwargs):
        """Create exception."""
        Exception.__init__(self, *args, **kwargs)