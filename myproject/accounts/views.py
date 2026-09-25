from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import FarmerProfile
from .serializers import FarmerProfileSerializer, LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer


class ProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class FarmerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmerProfileSerializer

    def get_object(self):
        profile, _ = FarmerProfile.objects.get_or_create(user=self.request.user)
        return profile


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({"detail": "Client should discard access and refresh tokens."})
