import { MenuItem } from '../types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Meals
  {
    id: 'meal-1',
    name: 'Royal Shahi Thali',
    category: 'Meals',
    price: 180,
    description: 'Fragrant saffron jeera rice, slow-cooked paneer butter masala, rich dal makhani, two butter rotis, gulab jamun, and crisp papad.',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    available: true,
    badge: "Chef's Special",
    calories: '650 kcal'
  },
  {
    id: 'meal-2',
    name: 'Nawabi Dum Biryani',
    category: 'Meals',
    price: 160,
    description: 'Aromatic basmati rice layered with spiced garden vegetables, caramelized shallots, mint, and saffron, served with cooling cucumber raita.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    available: true,
    badge: 'Popular',
    calories: '580 kcal'
  },
  {
    id: 'meal-3',
    name: 'Paneer Makhani Rice Bowl',
    category: 'Meals',
    price: 140,
    description: 'Soft cottage cheese cubes simmered in a velvety cashew and tomato gravy over steamed long-grain basmati rice.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '520 kcal'
  },
  {
    id: 'meal-4',
    name: 'South Indian Grand Feast',
    category: 'Meals',
    price: 130,
    description: 'Golden masala dosa accompanied by sambar, coconut chutney, tomato relish, and curd rice with ghee seasoning.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '490 kcal'
  },

  // Fast Food
  {
    id: 'ff-1',
    name: 'Imperial Crisp Veg Burger',
    category: 'Fast Food',
    price: 90,
    description: 'Crispy spiced potato & corn herb patty, aged cheddar slice, hydroponic lettuce, and smoked garlic mayo in toasted brioche.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    available: true,
    badge: 'Bestseller',
    calories: '440 kcal'
  },
  {
    id: 'ff-2',
    name: 'Truffle & Herb French Fries',
    category: 'Fast Food',
    price: 80,
    description: 'Hand-cut golden potatoes tossed in rosemary sea salt, parmesan dust, and served with house royal dip.',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '360 kcal'
  },
  {
    id: 'ff-3',
    name: 'Artisan Paneer Tikka Wrap',
    category: 'Fast Food',
    price: 110,
    description: 'Char-grilled cottage cheese cubes wrapped in whole wheat flaky paratha with mint relish and pickled red onions.',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '410 kcal'
  },
  {
    id: 'ff-4',
    name: 'Royal Club Grilled Sandwich',
    category: 'Fast Food',
    price: 100,
    description: 'Triple-decker butter-grilled sourdough packed with seasoned veggies, mozzarella cheese, and bell pepper relish.',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '460 kcal'
  },

  // Snacks
  {
    id: 'snk-1',
    name: 'Crispy Golden Samosa Platter',
    category: 'Snacks',
    price: 50,
    description: 'Pair of flaky artisanal pastry pockets filled with spiced potatoes, green peas, served with sweet tamarind and fresh mint chutneys.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    available: true,
    badge: 'All Time Fav',
    calories: '280 kcal'
  },
  {
    id: 'snk-2',
    name: 'Steamed Himalayan Dumplings',
    category: 'Snacks',
    price: 80,
    description: 'Six delicate steamed vegetable momos filled with finely minced garden vegetables and served with spicy roasted tomato dip.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '210 kcal'
  },
  {
    id: 'snk-3',
    name: 'Royal Kachori Chaat',
    category: 'Snacks',
    price: 70,
    description: 'Crushed crispy lentil kachori topped with whipped spiced yogurt, piquant chutneys, sev, and fresh pomegranate jewels.',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '320 kcal'
  },

  // Beverages
  {
    id: 'bev-1',
    name: 'Royal Kesar Badam Milk',
    category: 'Beverages',
    price: 60,
    description: 'Chilled full-cream milk infused with Kashmiri saffron strands, crushed almonds, pistachios, and aromatic cardamom.',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80',
    available: true,
    badge: 'Royal Special',
    calories: '240 kcal'
  },
  {
    id: 'bev-2',
    name: 'Cold Brew Coffee with Vanilla Cream',
    category: 'Beverages',
    price: 75,
    description: '16-hour slow-steeped Arabica coffee over ice, layered with delicate Madagascar vanilla sweet cream foam.',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '150 kcal'
  },
  {
    id: 'bev-3',
    name: 'Fresh Mango Alphonso Lassi',
    category: 'Beverages',
    price: 70,
    description: 'Thick, creamy churned yogurt blended with authentic Ratnagiri Alphonso mango pulp and cardamom garnish.',
    image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '260 kcal'
  },
  {
    id: 'bev-4',
    name: 'Kolkata Masala Kulhad Chai',
    category: 'Beverages',
    price: 30,
    description: 'Freshly brewed robust CTC tea leaves simmered with ginger, cinnamon, green cardamom, and fresh buffalo milk in an earthen cup.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    available: true,
    calories: '110 kcal'
  }
];
