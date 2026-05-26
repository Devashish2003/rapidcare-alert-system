import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Return great-circle distance in km between two GPS coordinates."""
    R = 6371
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)), 2)


def estimate_eta_minutes(distance_km, avg_speed_kmh=40):
    """Return ETA string like '8 mins' given distance and average speed."""
    minutes = round((distance_km / avg_speed_kmh) * 60)
    return f"{max(minutes, 1)} mins"
