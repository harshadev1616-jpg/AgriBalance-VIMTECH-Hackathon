from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import GovernmentScheme
from .services.schemes import matching_schemes
from .services.intelligence import AgricultureIntelligenceEngine


class ProfitCalculatorTests(TestCase):
    def test_profit_uses_current_input_values(self):
        result = AgricultureIntelligenceEngine().profit_calculator(
            district="Mandya",
            crop="Tomato",
            farm_size=2,
            soil="Loamy",
            water=62,
            yield_per_hectare=250,
            selling_price=1150,
            seed_cost=12000,
            fertilizer_cost=18000,
            labor_cost=25000,
            irrigation_cost=10000,
            other_cost=6000,
        )

        self.assertEqual(result["total_yield"], 500)
        self.assertEqual(result["revenue"], 575000)
        self.assertEqual(result["budget"], 71000)
        self.assertEqual(result["expenses"], 71000)
        self.assertEqual(result["net_profit"], 504000)
        self.assertEqual(result["roi"], 709.86)

    def test_profit_reacts_to_selling_price_change(self):
        engine = AgricultureIntelligenceEngine()
        payload = {
            "district": "Mandya",
            "crop": "Tomato",
            "farm_size": 2,
            "soil": "Loamy",
            "water": 62,
            "yield_per_hectare": 250,
            "seed_cost": 12000,
            "fertilizer_cost": 18000,
            "labor_cost": 25000,
            "irrigation_cost": 10000,
            "other_cost": 6000,
        }

        result_at_1150 = engine.profit_calculator(**payload, selling_price=1150)
        result_at_1500 = engine.profit_calculator(**payload, selling_price=1500)

        self.assertEqual(result_at_1150["revenue"], 575000)
        self.assertEqual(result_at_1150["net_profit"], 504000)
        self.assertEqual(result_at_1500["revenue"], 750000)
        self.assertEqual(result_at_1500["net_profit"], 679000)

    def test_profit_reacts_to_farm_size_change(self):
        engine = AgricultureIntelligenceEngine()
        payload = {
            "district": "Mandya",
            "crop": "Tomato",
            "soil": "Loamy",
            "water": 62,
            "yield_per_hectare": 250,
            "selling_price": 1500,
            "seed_cost": 12000,
            "fertilizer_cost": 18000,
            "labor_cost": 25000,
            "irrigation_cost": 10000,
            "other_cost": 6000,
        }

        result_at_2 = engine.profit_calculator(**payload, farm_size=2)
        result_at_3 = engine.profit_calculator(**payload, farm_size=3)

        self.assertEqual(result_at_2["revenue"], 750000)
        self.assertEqual(result_at_3["total_yield"], 750)
        self.assertEqual(result_at_3["revenue"], 1125000)
        self.assertEqual(result_at_3["net_profit"], 1054000)

    def test_profit_reacts_to_yield_per_hectare_change(self):
        engine = AgricultureIntelligenceEngine()
        payload = {
            "district": "Mandya",
            "crop": "Tomato",
            "farm_size": 3,
            "soil": "Loamy",
            "water": 62,
            "selling_price": 1500,
            "seed_cost": 12000,
            "fertilizer_cost": 18000,
            "labor_cost": 25000,
            "irrigation_cost": 10000,
            "other_cost": 6000,
        }

        result_at_250 = engine.profit_calculator(**payload, yield_per_hectare=250)
        result_at_300 = engine.profit_calculator(**payload, yield_per_hectare=300)

        self.assertEqual(result_at_250["revenue"], 1125000)
        self.assertEqual(result_at_300["total_yield"], 900)
        self.assertEqual(result_at_300["revenue"], 1350000)
        self.assertEqual(result_at_300["net_profit"], 1279000)


class GovernmentSchemeMatchingTests(TestCase):
    def setUp(self):
        GovernmentScheme.objects.create(
            name="Karnataka Rice Support",
            description="Support for eligible rice farmers.",
            eligibility="Rice farmers in Karnataka.",
            state="Karnataka",
            crops=["Rice"],
            farmer_categories=["small"],
            benefits="Seed support",
            application_process="Apply through the official department.",
            is_verified=True,
        )
        GovernmentScheme.objects.create(
            name="National General Support",
            description="General support.",
            eligibility="Eligible farmers.",
            benefits="Support varies.",
            application_process="Check the official source.",
        )

    def test_filters_by_state_crop_and_category(self):
        matches = matching_schemes({"state": "Karnataka", "crop": "Rice", "farmer_category": "small"})
        self.assertEqual({scheme.name for scheme in matches}, {"Karnataka Rice Support", "National General Support"})


class FarmerProfileTests(TestCase):
    def test_profile_is_one_per_user(self):
        user = get_user_model().objects.create_user(username="farmer", password="strong-password-123")
        from accounts.models import FarmerProfile

        profile = FarmerProfile.objects.create(user=user, crops=["Rice"], land_size_hectares=1.5)
        self.assertEqual(user.farmer_profile, profile)


class GovernmentSchemeApiTests(APITestCase):
    def test_scheme_endpoint_returns_empty_state_without_fabricating_records(self):
        response = self.client.get("/api/schemes/?state=Karnataka&crop=Rice")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])
