from rest_framework import serializers

from .models import GovernmentScheme


class GeoQuerySerializer(serializers.Serializer):
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class WeatherQuerySerializer(GeoQuerySerializer):
    units = serializers.ChoiceField(choices=["metric", "imperial", "standard"], default="metric")


class NasaImageryQuerySerializer(GeoQuerySerializer):
    date = serializers.DateField(required=False)
    dim = serializers.FloatField(default=0.12, min_value=0.01, max_value=0.5)


class SoilQuerySerializer(GeoQuerySerializer):
    properties = serializers.ListField(
        child=serializers.ChoiceField(choices=["phh2o", "soc", "nitrogen", "sand", "clay", "silt"]),
        required=False,
    )


class MarketQuerySerializer(serializers.Serializer):
    state = serializers.CharField(default="Karnataka", max_length=80)
    district = serializers.CharField(required=False, max_length=80)
    commodity = serializers.CharField(required=False, max_length=80)
    limit = serializers.IntegerField(default=50, min_value=1, max_value=1000)


class YieldPredictionSerializer(serializers.Serializer):
    rainfall = serializers.FloatField(min_value=0)
    temperature = serializers.FloatField()
    humidity = serializers.FloatField(min_value=0, max_value=100)
    nitrogen = serializers.FloatField(min_value=0)
    ph = serializers.FloatField(min_value=0, max_value=14)
    market_price = serializers.FloatField(min_value=0)


class DistrictQuerySerializer(serializers.Serializer):
    district = serializers.CharField(default="Mandya", max_length=80)


class CropBalancingSerializer(serializers.Serializer):
    district = serializers.CharField(default="Mandya", max_length=80)
    rainfall = serializers.FloatField(required=False, min_value=0)
    humidity = serializers.FloatField(required=False, min_value=0, max_value=100)
    temperature = serializers.FloatField(required=False)
    soil_health = serializers.FloatField(required=False, min_value=0, max_value=100)
    water_availability = serializers.FloatField(required=False, min_value=0, max_value=100)
    historical_yield = serializers.FloatField(required=False, min_value=0)
    current_market_price = serializers.FloatField(required=False, min_value=0)
    historical_price = serializers.FloatField(required=False, min_value=0)
    demand = serializers.FloatField(required=False, min_value=0, max_value=100)
    supply = serializers.FloatField(required=False, min_value=0, max_value=100)


class DistrictComparisonSerializer(serializers.Serializer):
    districts = serializers.ListField(
        child=serializers.CharField(max_length=80),
        required=False,
        allow_empty=False,
        max_length=8,
    )


class MarketIntelligenceSerializer(serializers.Serializer):
    district = serializers.CharField(default="Mandya", max_length=80)
    crop = serializers.CharField(default="Tomato", max_length=80)


class FarmerAssistantSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=500)
    district = serializers.CharField(default="Mandya", max_length=80)
    farm_size = serializers.FloatField(default=2.0, min_value=0.1)


class ProfitCalculatorSerializer(serializers.Serializer):
    district = serializers.CharField(default="Mandya", max_length=80)
    crop = serializers.CharField(required=False, max_length=80)
    farm_size = serializers.FloatField(min_value=0.1)
    budget = serializers.FloatField(required=False, min_value=0)
    soil = serializers.CharField(default="Loamy", max_length=80)
    water = serializers.FloatField(min_value=0, max_value=100)
    yield_per_hectare = serializers.FloatField(required=False, min_value=0)
    selling_price = serializers.FloatField(required=False, min_value=0)
    seed_cost = serializers.FloatField(default=0, min_value=0)
    fertilizer_cost = serializers.FloatField(default=0, min_value=0)
    labor_cost = serializers.FloatField(default=0, min_value=0)
    irrigation_cost = serializers.FloatField(default=0, min_value=0)
    other_cost = serializers.FloatField(default=0, min_value=0)


class SchemeQuerySerializer(serializers.Serializer):
    state = serializers.CharField(required=False, max_length=80)
    crop = serializers.CharField(required=False, max_length=80)
    farmer_category = serializers.CharField(required=False, max_length=20)
    district = serializers.CharField(required=False, max_length=80)


class GovernmentSchemeSerializer(serializers.ModelSerializer):
    data_status = serializers.SerializerMethodField()

    class Meta:
        model = GovernmentScheme
        fields = (
            "id", "name", "department", "description", "eligibility", "state", "crops",
            "farmer_categories", "benefits", "required_documents", "application_process",
            "deadline", "official_source_url", "application_url", "is_verified", "data_status",
        )

    def get_data_status(self, obj):
        return "verified" if obj.is_verified else "unverified_admin_data"


class PriceIntelligenceSerializer(serializers.Serializer):
    state = serializers.CharField(default="Karnataka", max_length=80)
    district = serializers.CharField(required=False, max_length=80)
    districts = serializers.CharField(required=False, max_length=500)
    commodity = serializers.CharField(required=False, max_length=80)
    limit = serializers.IntegerField(default=50, min_value=1, max_value=1000)


class DailyDecisionSerializer(serializers.Serializer):
    district = serializers.CharField(required=False, max_length=80)
    crop = serializers.CharField(required=False, max_length=80)
