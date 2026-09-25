from django.conf import settings
from datetime import datetime

from .base import ApiClient


class MarketDataClient(ApiClient):
    base_url = "https://api.data.gov.in/resource"
    AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"

    def __init__(self):
        super().__init__(settings.DATA_GOV_API_KEY)

    def crop_prices(self, state="Karnataka", district=None, commodity=None, limit=50):
        params = {
            "format": "json",
            "limit": limit,
            "filters[state]": state,
        }
        if self.api_key:
            params["api-key"] = self.api_key
        if district:
            params["filters[district]"] = district
        if commodity:
            params["filters[commodity]"] = commodity
        data = self.get(self.AGMARKNET_RESOURCE_ID, params=params)
        records = data.get("records", [])
        return {
            "count": len(records),
            "records": records,
            "trend": self._trend(records),
        }

    def _trend(self, records):
        prices = []
        for record in records:
            value = record.get("modal_price") or record.get("modal price")
            try:
                prices.append(float(value))
            except (TypeError, ValueError):
                continue
        if not prices:
            return {"average_modal_price": None, "min": None, "max": None}
        return {
            "average_modal_price": round(sum(prices) / len(prices), 2),
            "min": min(prices),
            "max": max(prices),
        }

    def price_intelligence(self, state="Karnataka", district=None, commodity=None, limit=50):
        data = self.crop_prices(state=state, district=district, commodity=commodity, limit=limit)
        records = data["records"]
        history = []
        for record in records:
            price = self._record_price(record)
            date_value = record.get("arrival_date") or record.get("arrival date") or record.get("date")
            if price is None:
                continue
            history.append({"date": date_value, "price": price, "market": record.get("market"), "district": record.get("district")})
        dated = [item for item in history if self._parse_date(item["date"])]
        dated.sort(key=lambda item: self._parse_date(item["date"]))
        direction = "stable"
        if len(dated) >= 2:
            change = dated[-1]["price"] - dated[0]["price"]
            threshold = max(1, abs(dated[0]["price"]) * 0.02)
            direction = "increasing" if change > threshold else "decreasing" if change < -threshold else "stable"
        prediction = self._prediction(dated)
        return {
            **data,
            "data_status": "actual_external_api",
            "history": dated,
            "price_range": data["trend"],
            "trend_direction": direction,
            "prediction": prediction,
        }

    def _record_price(self, record):
        value = record.get("modal_price") or record.get("modal price")
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _parse_date(self, value):
        if not value:
            return None
        for date_format in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(str(value), date_format)
            except ValueError:
                continue
        return None

    def _prediction(self, dated):
        if len(dated) < 2:
            return {"available": False, "reason": "At least two dated actual prices are required."}
        recent = dated[-min(len(dated), 12):]
        slope = (recent[-1]["price"] - recent[0]["price"]) / max(len(recent) - 1, 1)
        estimate = max(0, round(recent[-1]["price"] + slope, 2))
        confidence = "low" if len(recent) < 5 else "moderate"
        return {
            "available": True,
            "next_estimate": estimate,
            "confidence": confidence,
            "method": "simple_recent_linear_trend",
            "factors": ["recent actual modal prices", "number of available observations"],
            "disclaimer": "This is a trend estimate, not a guaranteed price.",
        }
