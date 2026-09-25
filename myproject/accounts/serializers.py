from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import FarmerProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "password", "first_name", "last_name")
        read_only_fields = ("id",)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = get_user_model()(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    farmer_profile = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "first_name", "last_name", "farmer_profile")

    def get_farmer_profile(self, user):
        profile = getattr(user, "farmer_profile", None)
        return FarmerProfileSerializer(profile).data if profile else None


class FarmerProfileSerializer(serializers.ModelSerializer):
    crops = serializers.ListField(child=serializers.CharField(max_length=80), required=False)

    class Meta:
        model = FarmerProfile
        exclude = ("user",)
        read_only_fields = ("updated_at",)

    def validate_crops(self, value):
        cleaned = [crop.strip() for crop in value if crop.strip()]
        if len(cleaned) > 20:
            raise serializers.ValidationError("You can add up to 20 crops.")
        return list(dict.fromkeys(cleaned))


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token
