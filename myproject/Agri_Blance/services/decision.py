from .intelligence import AgricultureIntelligenceEngine


class DailyDecisionService:
    def __init__(self):
        self.engine = AgricultureIntelligenceEngine()

    def build(self, district="Mandya", crop="Tomato", farm_size=None, profile=None):
        balancing = self.engine.crop_balancing(district)
        crop_view = self.engine.market_intelligence(district, crop)
        best = balancing["top_recommended_crops"][0]
        selected = next((item for item in balancing["top_recommended_crops"] if item["crop"] == crop), best)
        situation = {
            "district": district,
            "crop": crop,
            "market": {"demand": crop_view["demand"], "saturation": crop_view["market_saturation"], "data_status": "calculated_from_seeded_model_profiles"},
            "crop_signal": {"oversupply_risk": selected["oversupply_risk"], "water_fit": selected["water_usage_score"], "data_status": "calculated_from_seeded_model_profiles"},
        }
        if selected["oversupply_risk"] >= 75:
            reason = f"{crop} has a high modeled oversupply risk in {district}."
            action = f"Avoid expanding {crop} acreage today; compare it with {best['crop']} before making a planting decision."
        elif selected["water_usage_score"] < 45:
            reason = f"{crop} has a weaker modeled water fit for conditions in {district}."
            action = f"Check irrigation availability and consider {best['crop']} as a lower-risk alternative."
        else:
            reason = f"{crop} has a workable modeled balance of demand, water fit, and local supply in {district}."
            action = f"Review current mandi arrivals before selling and monitor {crop} for the next field action."
        return {
            "situation": situation,
            "reason": reason,
            "recommended_action": action,
            "confidence": "moderate",
            "data_status": "calculated_and_model_based",
            "disclaimer": "This supports a decision; it is not a guaranteed outcome.",
        }
