import { FoodItem } from "./types";

export const DEFAULT_FOOD_ITEMS: Omit<FoodItem, "id">[] = [
  {
    name: "Savory Avocado Crisp Toast",
    price: 12.50,
    imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600",
    description: "Crispy thick-sliced sourdough toast topped with creamy hand-mashed Hass avocado, organic pea shoots, and toasted hemp seeds.",
    category: "Mains",
    isAvailable: true
  },
  {
    name: "Garden Green Quinoa Harvest",
    price: 14.00,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600",
    description: "Organic tri-color quinoa served with sweet roasted potatoes, charred heirloom baby carrots, garden-fresh spinach, and a tangy avocado vinaigrette.",
    category: "Mains",
    isAvailable: true
  },
  {
    name: "Zesty Berry Spinach Bowl",
    price: 11.50,
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600",
    description: "Baby spinach tossed with fresh sliced strawberries, wild blueberries, candied raw walnuts, and an elegant citrus-herb dressing.",
    category: "Salads",
    isAvailable: true
  },
  {
    name: "Matcha Chia Coco Pudding",
    price: 8.50,
    imageUrl: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&q=80&w=600",
    description: "Creamy vanilla chia seed pudding layered with high-grade organic Japanese matcha powder, wild raspberries, and unsweetened coconut shreds.",
    category: "Desserts",
    isAvailable: true
  },
  {
    name: "Cold-Pressed Detox Green Juice",
    price: 6.50,
    imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587caa90?auto=format&fit=crop&q=80&w=600",
    description: "Nutrient-packed cold press of Tuscan curly kale, crisp green apple, English cucumber, fresh ginger root, and organic lemon squeeze.",
    category: "Drinks",
    isAvailable: true
  },
  {
    name: "Fresh Mint Infused Limeade",
    price: 5.50,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    description: "Zesty garden-fresh lime juice muddled with garden mint sprigs, pure raw organic agave syrup, and filtered spring water.",
    category: "Drinks",
    isAvailable: true
  }
];
