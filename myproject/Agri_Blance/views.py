from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml import CropYieldPredictor
from .serializers import (
    CropBalancingSerializer,
    DistrictComparisonSerializer,
    DistrictQuerySerializer,
    FarmerAssistantSerializer,
    MarketQuerySerializer,
    MarketIntelligenceSerializer,
    NasaImageryQuerySerializer,
    ProfitCalculatorSerializer,
    DailyDecisionSerializer,
    GovernmentSchemeSerializer,
    PriceIntelligenceSerializer,
    SchemeQuerySerializer,
    SoilQuerySerializer,
    WeatherQuerySerializer,
    YieldPredictionSerializer,
)
from .services import MarketDataClient, NasaEarthClient, OpenWeatherClient, SoilGridsClient
from .services.intelligence import AgricultureIntelligenceEngine
from .services.decision import DailyDecisionService
from .services.schemes import matching_schemes
from .models import GovernmentScheme


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "AgriBalance API"})


class CurrentWeatherView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = WeatherQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        data = OpenWeatherClient().current_weather(payload["lat"], payload["lon"], payload["units"])
        return Response(data)


class ForecastView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = WeatherQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        data = OpenWeatherClient().five_day_forecast(payload["lat"], payload["lon"], payload["units"])
        return Response(data)


class NasaImageryView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = NasaImageryQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        date = payload.get("date")
        data = NasaEarthClient().imagery(payload["lat"], payload["lon"], date.isoformat() if date else None, payload["dim"])
        return Response(data)


class SoilProfileView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = SoilQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        data = SoilGridsClient().soil_profile(payload["lat"], payload["lon"], payload.get("properties"))
        return Response(data)


class MarketPricesView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = MarketQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = MarketDataClient().crop_prices(**serializer.validated_data)
        return Response(data)


class MarketPriceIntelligenceView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = PriceIntelligenceSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        districts = [item.strip() for item in payload.pop("districts", "").split(",") if item.strip()]
        if districts:
            payload.pop("district", None)
            return Response({
                "data_status": "actual_external_api",
                "comparisons": [MarketDataClient().price_intelligence(district=district, **payload) for district in districts],
            })
        return Response(MarketDataClient().price_intelligence(**payload))


class YieldPredictionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = YieldPredictionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(CropYieldPredictor().predict(serializer.validated_data))


class CropBalancingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CropBalancingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        district = payload.pop("district")
        return Response(AgricultureIntelligenceEngine().crop_balancing(district, payload))


class DistrictHeatmapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(AgricultureIntelligenceEngine().district_heatmap())


class DistrictComparisonView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DistrictComparisonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(AgricultureIntelligenceEngine().compare_districts(serializer.validated_data.get("districts")))


class MarketIntelligenceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = MarketIntelligenceSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        return Response(AgricultureIntelligenceEngine().market_intelligence(payload["district"], payload["crop"]))


class FarmerAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FarmerAssistantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        return Response(AgricultureIntelligenceEngine().farmer_assistant(payload["question"], payload["district"], payload["farm_size"]))


class SmartNotificationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = DistrictQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return Response(AgricultureIntelligenceEngine().notifications(serializer.validated_data["district"]))


class ProfitCalculatorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ProfitCalculatorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(AgricultureIntelligenceEngine().profit_calculator(**serializer.validated_data))


class SatelliteAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = DistrictQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return Response(AgricultureIntelligenceEngine().satellite_analytics(serializer.validated_data["district"]))


class AdminAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(AgricultureIntelligenceEngine().admin_analytics())


class GovernmentDashboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(AgricultureIntelligenceEngine().government_dashboard())


class GovernmentSchemeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = SchemeQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        filters = serializer.validated_data
        if request.user.is_authenticated:
            profile = getattr(request.user, "farmer_profile", None)
            if profile:
                filters.setdefault("state", profile.state)
                filters.setdefault("farmer_category", profile.farmer_category)
                if profile.crops and not filters.get("crop"):
                    filters["crop"] = profile.crops[0]
        schemes = matching_schemes(filters)
        return Response({
            "count": len(schemes),
            "data_status": "verified_only" if all(item.is_verified for item in schemes) else "contains_unverified_admin_data",
            "results": GovernmentSchemeSerializer(schemes, many=True).data,
        })


class DailyDecisionView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        serializer = DailyDecisionSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        profile = getattr(request.user, "farmer_profile", None) if request.user.is_authenticated else None
        district = payload.get("district") or (profile.district if profile and profile.district else "Mandya")
        crop = payload.get("crop") or (profile.crops[0] if profile and profile.crops else "Tomato")
        return Response(DailyDecisionService().build(district=district, crop=crop, profile=profile))
