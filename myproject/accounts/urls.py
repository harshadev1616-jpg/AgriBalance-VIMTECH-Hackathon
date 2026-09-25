from django.urls import path

from .views import FarmerProfileView, LoginView, LogoutView, ProfileView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", ProfileView.as_view(), name="profile"),
    path("farmer-profile/", FarmerProfileView.as_view(), name="farmer-profile"),
]
