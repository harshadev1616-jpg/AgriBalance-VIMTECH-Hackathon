from django.db.models import Q

from ..models import GovernmentScheme


def matching_schemes(filters):
    queryset = GovernmentScheme.objects.all()
    state = (filters.get("state") or "").strip().lower()
    crop = (filters.get("crop") or "").strip().lower()
    category = (filters.get("farmer_category") or "").strip().lower()

    if state:
        queryset = queryset.filter(Q(state__iexact=state) | Q(state=""))
    results = []
    for scheme in queryset:
        scheme_crops = {str(item).strip().lower() for item in scheme.crops}
        scheme_categories = {str(item).strip().lower() for item in scheme.farmer_categories}
        if crop and scheme_crops and crop not in scheme_crops:
            continue
        if category and scheme_categories and category not in scheme_categories:
            continue
        results.append(scheme)
    return results
