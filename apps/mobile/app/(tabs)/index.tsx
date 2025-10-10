import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import { usePropertiesPublicControllerFindAll } from "@/api/queries/public/properties-public/properties-public";
import { HomeHeader, PropertiesCarousel, PropertiesList } from "@/components";
import { SearchBar } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { useAuth } from "@/hooks/use-auth";
import { mvs } from "@/utils/scaling";
import { router } from "expo-router";
import { ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: propertiesResponse, isLoading: loadingProperties } = usePropertiesPublicControllerFindAll({
    page: 1,
    limit: 10,
  });

  const handlePropertyPress = (property: PropertyResponseDto) => {
    if (!property || !property._id) {
      console.warn("Invalid property data:", property);
      return;
    }

    try {
      console.log("Property pressed, ID:", property._id);
      console.log("Property name:", property.name);
      router.push(`/property/${property._id}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleFavoritePress = (property: PropertyResponseDto) => {
    // Handle favorite action (to be implemented)
    console.log("Favorite pressed:", property._id);
  };

  const handleSeeAllPress = () => {
    // Navigate to explore page
    router.push("/(tabs)/booking-history");
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log("Notification pressed");
  };

  const handleSearchPress = () => {
    // Handle search press
    console.log("Search pressed");
  };

  const handleFilterPress = () => {
    // Handle filter press
    console.log("Filter pressed");
  };

  return (
    <TabScreenTemplate>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <HomeHeader
          userName={user?.firstName || "Guest"}
          userImage={user?.avatarUrl || require("@/assets/images/avatar.png")}
          notificationCount={3}
          onNotificationPress={handleNotificationPress}
        />

        {/* Search Bar */}
        <SearchBar filterCount={0} onSearchPress={handleSearchPress} onFilterPress={handleFilterPress} />

        {/* Properties Carousel */}
        <PropertiesCarousel
          title="Popular homestays"
          properties={propertiesResponse?.data?.items || []}
          loading={loadingProperties}
          onPropertyPress={handlePropertyPress}
          onFavoritePress={handleFavoritePress}
          onSeeAllPress={handleSeeAllPress}
        />

        {/* Properties List */}
        <PropertiesList
          title="Recommended for you"
          properties={propertiesResponse?.data?.items || []}
          loading={loadingProperties}
          onPropertyPress={handlePropertyPress}
          onFavoritePress={handleFavoritePress}
          onSeeAllPress={handleSeeAllPress}
        />

        {/* Second Properties Section */}
        <PropertiesList
          title="Places near you"
          properties={propertiesResponse?.data?.items || []}
          loading={loadingProperties}
          onPropertyPress={handlePropertyPress}
          onFavoritePress={handleFavoritePress}
          onSeeAllPress={handleSeeAllPress}
        />
      </ScrollView>
    </TabScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxxl + mvs(80), // xxxl spacing + tab bar height + extra padding
  },
}));
