import 'dotenv/config';
import { PrismaClient, UserRole, StockUnit } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const HASH = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

const USERS = [
  { name: 'System Administrator', email: 'admin@restaurant.com', password: 'Admin@123', phone: '+1 555 010 0001', role: UserRole.ADMIN },
  { name: 'Restaurant Manager', email: 'manager@restaurant.com', password: 'Manager@123', phone: '+1 555 010 0002', role: UserRole.MANAGER },
  { name: 'Head Cashier', email: 'cashier@restaurant.com', password: 'Cashier@123', phone: '+1 555 010 0003', role: UserRole.CASHIER },
  { name: 'Lead Waiter', email: 'waiter@restaurant.com', password: 'Waiter@123', phone: '+1 555 010 0004', role: UserRole.WAITER },
  { name: 'Kitchen Staff', email: 'kitchen@restaurant.com', password: 'Kitchen@123', phone: '+1 555 010 0005', role: UserRole.KITCHEN_STAFF },
] as const;

const CATEGORIES: { name: string; position: number; description: string }[] = [
  { name: 'Burgers', position: 1, description: 'Hand-pressed gourmet burgers' },
  { name: 'Pizza', position: 2, description: 'Stone-baked pizzas' },
  { name: 'Rice', position: 3, description: 'Wok-fired rice dishes' },
  { name: 'BBQ', position: 4, description: 'Smoky barbecue favorites' },
  { name: 'Drinks', position: 5, description: 'Refreshing beverages' },
  { name: 'Desserts', position: 6, description: 'Sweet endings' },
];

interface SeedVariation {
  name: string;
  priceAdjustment: string;
  isDefault?: boolean;
}

interface SeedAddOn {
  name: string;
  price: string;
}

interface SeedMenuItem {
  name: string;
  sku: string;
  price: string;
  description?: string;
  prepTimeMinutes?: number;
  taxRate: string;
  category: string;
  variations?: SeedVariation[];
  addOns?: SeedAddOn[];
}

const MENU_ITEMS: SeedMenuItem[] = [
  {
    name: 'Classic Cheeseburger',
    sku: 'BUR-001',
    price: '9.50',
    description: 'Beef patty, cheddar, lettuce, tomato, house sauce',
    prepTimeMinutes: 15,
    taxRate: '10',
    category: 'Burgers',
    variations: [
      { name: 'Single', priceAdjustment: '0', isDefault: true },
      { name: 'Double', priceAdjustment: '3.00' },
      { name: 'Triple', priceAdjustment: '5.00' },
    ],
    addOns: [
      { name: 'Extra Cheese', price: '1.00' },
      { name: 'Extra Patty', price: '3.00' },
      { name: 'Bacon', price: '1.50' },
    ],
  },
  {
    name: 'Smash Burger',
    sku: 'BUR-002',
    price: '10.50',
    description: 'Double-smashed patty, caramelized onion, special sauce',
    prepTimeMinutes: 12,
    taxRate: '10',
    category: 'Burgers',
  },
  {
    name: 'BBQ Bacon Burger',
    sku: 'BUR-003',
    price: '11.00',
    description: 'Beef patty, crispy bacon, BBQ sauce, crispy onions',
    prepTimeMinutes: 15,
    taxRate: '10',
    category: 'Burgers',
  },
  {
    name: 'Veggie Burger',
    sku: 'BUR-004',
    price: '8.50',
    description: 'Plant-based patty, avocado, sprouts, vegan mayo',
    prepTimeMinutes: 10,
    taxRate: '10',
    category: 'Burgers',
  },
  {
    name: 'Margherita Pizza',
    sku: 'PIZ-001',
    price: '12.00',
    description: 'San Marzano tomatoes, fresh mozzarella, basil',
    prepTimeMinutes: 20,
    taxRate: '10',
    category: 'Pizza',
    variations: [
      { name: '10 inch', priceAdjustment: '-2.00' },
      { name: '12 inch', priceAdjustment: '0', isDefault: true },
      { name: '14 inch', priceAdjustment: '4.00' },
    ],
  },
  {
    name: 'Pepperoni Pizza',
    sku: 'PIZ-002',
    price: '14.00',
    description: 'Double pepperoni, mozzarella, oregano',
    prepTimeMinutes: 20,
    taxRate: '10',
    category: 'Pizza',
  },
  {
    name: 'BBQ Chicken Pizza',
    sku: 'PIZ-003',
    price: '15.00',
    description: 'BBQ sauce, grilled chicken, red onion, cilantro',
    prepTimeMinutes: 22,
    taxRate: '10',
    category: 'Pizza',
  },
  {
    name: 'Four Cheese Pizza',
    sku: 'PIZ-004',
    price: '15.50',
    description: 'Mozzarella, gorgonzola, parmesan, ricotta',
    prepTimeMinutes: 20,
    taxRate: '10',
    category: 'Pizza',
  },
  {
    name: 'Chicken Fried Rice',
    sku: 'RIC-001',
    price: '8.00',
    description: 'Jasmine rice, chicken, egg, spring onion',
    prepTimeMinutes: 12,
    taxRate: '10',
    category: 'Rice',
  },
  {
    name: 'Vegetable Fried Rice',
    sku: 'RIC-002',
    price: '7.00',
    description: 'Mixed vegetables, egg, soy glaze',
    prepTimeMinutes: 10,
    taxRate: '10',
    category: 'Rice',
  },
  {
    name: 'Beef Fried Rice',
    sku: 'RIC-003',
    price: '9.00',
    description: 'Sliced beef, jasmine rice, bell pepper, chili',
    prepTimeMinutes: 14,
    taxRate: '10',
    category: 'Rice',
  },
  {
    name: 'BBQ Half Chicken',
    sku: 'BBQ-001',
    price: '13.00',
    description: 'Half chicken, house BBQ glaze, fries',
    prepTimeMinutes: 25,
    taxRate: '10',
    category: 'BBQ',
  },
  {
    name: 'Chicken Wings (6 pcs)',
    sku: 'BBQ-002',
    price: '7.50',
    description: 'Crispy wings tossed in BBQ or buffalo sauce',
    prepTimeMinutes: 18,
    taxRate: '10',
    category: 'BBQ',
  },
  {
    name: 'Lamb Skewers (3 pcs)',
    sku: 'BBQ-003',
    price: '10.00',
    description: 'Char-grilled lamb, smoked paprika, mint yogurt',
    prepTimeMinutes: 20,
    taxRate: '10',
    category: 'BBQ',
  },
  {
    name: 'Coca-Cola',
    sku: 'DRK-001',
    price: '2.50',
    description: 'Chilled 330ml can',
    prepTimeMinutes: 1,
    taxRate: '0',
    category: 'Drinks',
  },
  {
    name: 'Fresh Orange Juice',
    sku: 'DRK-002',
    price: '4.00',
    description: 'Squeezed to order, 300ml',
    prepTimeMinutes: 3,
    taxRate: '0',
    category: 'Drinks',
  },
  {
    name: 'Iced Tea',
    sku: 'DRK-003',
    price: '3.00',
    description: 'House-brewed, lemon',
    prepTimeMinutes: 2,
    taxRate: '0',
    category: 'Drinks',
  },
  {
    name: 'Sparkling Water',
    sku: 'DRK-004',
    price: '2.00',
    description: '500ml bottle',
    prepTimeMinutes: 1,
    taxRate: '0',
    category: 'Drinks',
  },
  {
    name: 'Chocolate Lava Cake',
    sku: 'DES-001',
    price: '6.00',
    description: 'Molten center, vanilla ice cream',
    prepTimeMinutes: 12,
    taxRate: '10',
    category: 'Desserts',
  },
  {
    name: 'Tiramisu',
    sku: 'DES-002',
    price: '5.50',
    description: 'Classic Italian, mascarpone, espresso',
    prepTimeMinutes: 5,
    taxRate: '10',
    category: 'Desserts',
  },
  {
    name: 'Vanilla Ice Cream',
    sku: 'DES-003',
    price: '3.50',
    description: 'Two scoops, wafer',
    prepTimeMinutes: 2,
    taxRate: '10',
    category: 'Desserts',
  },
];

const SECTIONS = [
  { name: 'Main Hall', position: 1, tables: [1, 2, 3, 4, 5, 6] },
  { name: 'Terrace', position: 2, tables: [7, 8] },
  { name: 'VIP Lounge', position: 3, tables: [9, 10] },
];

const CAPACITY_BY_TABLE: Record<number, number> = {
  1: 2, 2: 2, 3: 4, 4: 4, 5: 4, 6: 6, 7: 2, 8: 2, 9: 8, 10: 8,
};

/** Demo statuses so the floor plan (module 4) shows variety. */
const STATUS_BY_TABLE: Partial<Record<number, 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'>> = {
  3: 'OCCUPIED',
  7: 'CLEANING',
  9: 'RESERVED',
};

interface SeedCustomer {
  name: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
  totalOrders?: number;
  totalSpending?: string;
}

const CUSTOMERS: SeedCustomer[] = [
  {
    name: 'Alice Johnson',
    phone: '+1 555 010 1001',
    email: 'alice.johnson@example.com',
    address: '12 Oak Avenue, Downtown',
    notes: 'Prefers window seats',
    totalOrders: 12,
    totalSpending: '248.50',
  },
  {
    name: 'Bob Martinez',
    phone: '+1 555 010 1002',
    email: 'bob.martinez@example.com',
    address: '34 Maple Road',
    notes: 'Allergic to peanuts',
    totalOrders: 7,
    totalSpending: '132.00',
  },
  {
    name: 'Carol Nguyen',
    phone: '+1 555 010 1003',
    email: 'carol.nguyen@example.com',
    totalOrders: 5,
    totalSpending: '96.00',
  },
  {
    name: 'David Kim',
    phone: '+1 555 010 1004',
    email: 'david.kim@example.com',
    address: '78 Cedar Lane',
    notes: 'Regular lunch customer',
    totalOrders: 18,
    totalSpending: '410.75',
  },
  {
    name: 'Emma Wilson',
    phone: '+1 555 010 1005',
    email: 'emma.wilson@example.com',
    totalOrders: 2,
    totalSpending: '38.75',
  },
];

interface SeedInventoryItem {
  name: string;
  sku: string;
  unit: StockUnit;
  quantity: string;
  minQuantity: string;
  costPrice: string;
  category: string;
}

const INVENTORY_ITEMS: SeedInventoryItem[] = [
  { name: 'Burger Buns', sku: 'ING-001', unit: StockUnit.PIECE, quantity: '240', minQuantity: '50', costPrice: '0.35', category: 'Bakery' },
  { name: 'Beef Patty', sku: 'ING-002', unit: StockUnit.PIECE, quantity: '120', minQuantity: '30', costPrice: '1.10', category: 'Meat' },
  { name: 'Cheese Slices', sku: 'ING-003', unit: StockUnit.PIECE, quantity: '180', minQuantity: '50', costPrice: '0.40', category: 'Dairy' },
  { name: 'Bacon Strips', sku: 'ING-004', unit: StockUnit.PIECE, quantity: '90', minQuantity: '20', costPrice: '0.55', category: 'Meat' },
  { name: 'Potato', sku: 'ING-005', unit: StockUnit.KG, quantity: '55', minQuantity: '10', costPrice: '0.90', category: 'Produce' },
  { name: 'Cooking Oil', sku: 'ING-006', unit: StockUnit.LITER, quantity: '32', minQuantity: '8', costPrice: '2.20', category: 'Pantry' },
  { name: 'Pizza Dough', sku: 'ING-007', unit: StockUnit.PIECE, quantity: '42', minQuantity: '10', costPrice: '1.20', category: 'Bakery' },
  { name: 'Mozzarella', sku: 'ING-008', unit: StockUnit.KG, quantity: '16', minQuantity: '5', costPrice: '6.50', category: 'Dairy' },
  { name: 'Tomato Sauce', sku: 'ING-009', unit: StockUnit.LITER, quantity: '22', minQuantity: '6', costPrice: '2.80', category: 'Pantry' },
  { name: 'Rice', sku: 'ING-010', unit: StockUnit.KG, quantity: '85', minQuantity: '20', costPrice: '1.10', category: 'Pantry' },
  { name: 'Chicken Breast', sku: 'ING-011', unit: StockUnit.KG, quantity: '42', minQuantity: '10', costPrice: '2.90', category: 'Meat' },
  { name: 'Cola Syrup', sku: 'ING-012', unit: StockUnit.LITER, quantity: '12', minQuantity: '4', costPrice: '4.50', category: 'Beverages' },
  { name: 'Oranges', sku: 'ING-013', unit: StockUnit.KG, quantity: '26', minQuantity: '8', costPrice: '1.30', category: 'Produce' },
  { name: 'Flour', sku: 'ING-014', unit: StockUnit.KG, quantity: '60', minQuantity: '15', costPrice: '0.80', category: 'Pantry' },
  { name: 'Vanilla Ice Cream', sku: 'ING-015', unit: StockUnit.LITER, quantity: '10', minQuantity: '3', costPrice: '3.60', category: 'Frozen' },
  { name: 'Cocoa Powder', sku: 'ING-016', unit: StockUnit.KG, quantity: '5', minQuantity: '2', costPrice: '8.00', category: 'Pantry' },
  { name: 'Espresso Beans', sku: 'ING-017', unit: StockUnit.KG, quantity: '8', minQuantity: '3', costPrice: '9.50', category: 'Beverages' },
  { name: 'Mascarpone', sku: 'ING-018', unit: StockUnit.KG, quantity: '6', minQuantity: '2', costPrice: '7.20', category: 'Dairy' },
  { name: 'BBQ Sauce', sku: 'ING-019', unit: StockUnit.LITER, quantity: '9', minQuantity: '3', costPrice: '3.10', category: 'Pantry' },
  { name: 'Lamb Leg', sku: 'ING-020', unit: StockUnit.KG, quantity: '18', minQuantity: '6', costPrice: '5.80', category: 'Meat' },
  { name: 'Eggs', sku: 'ING-021', unit: StockUnit.PIECE, quantity: '120', minQuantity: '40', costPrice: '0.15', category: 'Dairy' },
];

interface SeedRecipe {
  menuItemName: string;
  name: string;
  yield: number;
  ingredients: { itemName: string; quantity: string }[];
}

const SUPPLIERS = [
  { name: 'Fresh Farm Produce', company: 'Fresh Farm Ltd.', phone: '+1 555 010 8800', email: 'orders@freshfarm.example', address: '88 Farm Road, Rural', notes: 'Vegetables, fruit and dairy. Net-30 terms.' },
  { name: 'Meat & More', company: 'Meat & More Co.', phone: '+1 555 010 8810', email: 'sales@meatandmore.example', address: '110 Butcher Ave, Industrial Park', notes: 'Beef, poultry and pork. Call by 4pm for next-day delivery.' },
  { name: 'City Pantry Wholesale', company: 'City Pantry Inc.', phone: '+1 555 010 8820', email: 'accounts@citypantry.example', address: '5 Warehouse Blvd, Commerce District', notes: 'Dry goods, oils and beverages. Weekly standing order.' },
];

const RECIPES: SeedRecipe[] = [
  {
    menuItemName: 'Classic Cheeseburger',
    name: 'Classic Cheeseburger',
    yield: 1,
    ingredients: [
      { itemName: 'Burger Buns', quantity: '1' },
      { itemName: 'Beef Patty', quantity: '1' },
      { itemName: 'Cheese Slices', quantity: '1' },
    ],
  },
  {
    menuItemName: 'BBQ Bacon Burger',
    name: 'BBQ Bacon Burger',
    yield: 1,
    ingredients: [
      { itemName: 'Burger Buns', quantity: '1' },
      { itemName: 'Beef Patty', quantity: '1' },
      { itemName: 'Cheese Slices', quantity: '1' },
      { itemName: 'Bacon Strips', quantity: '2' },
      { itemName: 'BBQ Sauce', quantity: '0.030' },
    ],
  },
  {
    menuItemName: 'Margherita Pizza',
    name: 'Margherita Pizza',
    yield: 1,
    ingredients: [
      { itemName: 'Pizza Dough', quantity: '1' },
      { itemName: 'Mozzarella', quantity: '0.120' },
      { itemName: 'Tomato Sauce', quantity: '0.150' },
    ],
  },
  {
    menuItemName: 'Pepperoni Pizza',
    name: 'Pepperoni Pizza',
    yield: 1,
    ingredients: [
      { itemName: 'Pizza Dough', quantity: '1' },
      { itemName: 'Mozzarella', quantity: '0.120' },
      { itemName: 'Tomato Sauce', quantity: '0.150' },
    ],
  },
  {
    menuItemName: 'Chicken Fried Rice',
    name: 'Chicken Fried Rice',
    yield: 1,
    ingredients: [
      { itemName: 'Rice', quantity: '0.250' },
      { itemName: 'Chicken Breast', quantity: '0.150' },
      { itemName: 'Eggs', quantity: '1' },
      { itemName: 'Cooking Oil', quantity: '0.020' },
    ],
  },
  {
    menuItemName: 'Chocolate Lava Cake',
    name: 'Chocolate Lava Cake',
    yield: 4,
    ingredients: [
      { itemName: 'Flour', quantity: '0.300' },
      { itemName: 'Cocoa Powder', quantity: '0.120' },
      { itemName: 'Eggs', quantity: '4' },
    ],
  },
  {
    menuItemName: 'Fresh Orange Juice',
    name: 'Fresh Orange Juice',
    yield: 1,
    ingredients: [{ itemName: 'Oranges', quantity: '0.300' }],
  },
];

async function clearDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.kitchenOrderItem.deleteMany(),
    prisma.kitchenOrder.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.reservation.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.inventoryTransaction.deleteMany(),
    prisma.recipeIngredient.deleteMany(),
    prisma.recipe.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.addOn.deleteMany(),
    prisma.menuItemVariation.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.menuCategory.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.restaurantTable.deleteMany(),
    prisma.tableSection.deleteMany(),
    prisma.user.deleteMany(),
    prisma.restaurantSettings.deleteMany(),
    prisma.restaurant.deleteMany(),
  ]);
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Seeding started...');
  await clearDatabase();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Bella Vista Restaurant',
      address: '123 Main Street, Downtown',
      phone: '+1 555 010 2200',
      email: 'hello@bellavista.example',
      currency: 'USD',
      taxPercentage: '10',
      serviceChargePct: '5',
      settings: {
        create: {
          taxPercentage: '10',
          serviceChargePct: '5',
          currency: 'USD',
          receiptHeader: 'Bella Vista Restaurant\nThank you for dining with us!',
          receiptFooter: 'Visit us again!',
          orderNumberPrefix: 'ORD',
          orderNumberStart: 1,
          openingHours: {
            monday: '10:00 - 23:00',
            tuesday: '10:00 - 23:00',
            wednesday: '10:00 - 23:00',
            thursday: '10:00 - 23:00',
            friday: '10:00 - 00:00',
            saturday: '10:00 - 00:00',
            sunday: '11:00 - 22:00',
          },
        },
      },
    },
  });

  await Promise.all(
    USERS.map(async (u) =>
      prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: await HASH(u.password),
          phone: u.phone,
          role: u.role,
        },
      }),
    ),
  );

  const sections = await Promise.all(
    SECTIONS.map((section) =>
      prisma.tableSection.create({ data: { name: section.name, position: section.position } }),
    ),
  );

  for (const section of SECTIONS) {
    const sectionRecord = sections.find((s) => s.name === section.name);
    if (!sectionRecord) continue;
    for (const tableNumber of section.tables) {
      await prisma.restaurantTable.create({
        data: {
          tableNumber,
          name: `Table ${String(tableNumber).padStart(2, '0')}`,
          capacity: CAPACITY_BY_TABLE[tableNumber] ?? 4,
          sectionId: sectionRecord.id,
          status: STATUS_BY_TABLE[tableNumber] ?? 'AVAILABLE',
        },
      });
    }
  }

  await Promise.all(
    CUSTOMERS.map((customer) =>
      prisma.customer.create({
        data: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address ?? null,
          notes: customer.notes ?? null,
          totalOrders: customer.totalOrders ?? 0,
          totalSpending: customer.totalSpending ?? '0',
        },
      }),
    ),
  );

  const categoryRecords = new Map<string, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.menuCategory.create({
      data: { name: category.name, position: category.position, description: category.description },
    });
    categoryRecords.set(category.name, record.id);
  }

  for (const item of MENU_ITEMS) {
    const categoryId = categoryRecords.get(item.category);
    if (!categoryId) throw new Error(`Unknown category for ${item.name}: ${item.category}`);

    await prisma.menuItem.create({
      data: {
        name: item.name,
        sku: item.sku,
        price: item.price,
        description: item.description,
        preparationTime: item.prepTimeMinutes,
        taxRate: item.taxRate,
        categoryId,
        variations: item.variations
          ? { create: item.variations.map((v) => ({ name: v.name, priceAdjustment: v.priceAdjustment, isDefault: v.isDefault ?? false })) }
          : undefined,
        addOns: item.addOns ? { create: item.addOns.map((a) => ({ name: a.name, price: a.price })) } : undefined,
      },
    });
  }

  await Promise.all(
    INVENTORY_ITEMS.map((item) =>
      prisma.inventoryItem.create({
        data: {
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          costPrice: item.costPrice,
          category: item.category,
        },
      }),
    ),
  );

  const inventoryByName = await prisma.inventoryItem.findMany({ select: { id: true, name: true } });
  const inventoryIdByName = new Map(inventoryByName.map((item) => [item.name, item.id]));

  await Promise.all(
    SUPPLIERS.map((supplier) =>
      prisma.supplier.create({
        data: {
          name: supplier.name,
          company: supplier.company,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          notes: supplier.notes,
        },
      }),
    ),
  );
  for (const recipe of RECIPES) {
    const menuItem = await prisma.menuItem.findFirst({ where: { name: recipe.menuItemName }, select: { id: true } });
    if (!menuItem) throw new Error(`Unknown menu item for recipe: ${recipe.menuItemName}`);
    await prisma.recipe.create({
      data: {
        menuItemId: menuItem.id,
        name: recipe.name,
        yield: recipe.yield,
        ingredients: {
          create: recipe.ingredients.map((ingredient) => {
            const id = inventoryIdByName.get(ingredient.itemName);
            if (!id) throw new Error(`Unknown ingredient for recipe: ${recipe.name} -> ${ingredient.itemName}`);
            return { inventoryItemId: id, quantity: ingredient.quantity };
          }),
        },
      },
    });
  }

  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.menuCategory.count(),
    prisma.menuItem.count(),
    prisma.menuItemVariation.count(),
    prisma.addOn.count(),
    prisma.restaurantTable.count(),
    prisma.tableSection.count(),
    prisma.inventoryItem.count(),
    prisma.customer.count(),
    prisma.recipe.count(),
    prisma.recipeIngredient.count(),
    prisma.supplier.count(),
  ]);

  // eslint-disable-next-line no-console
  console.log('Seeding completed:');
  // eslint-disable-next-line no-console
  console.log(`  restaurant: ${restaurant.name} (${restaurant.currency})`);
  // eslint-disable-next-line no-console
  console.log(`  users: ${counts[0]}, categories: ${counts[1]}, menu items: ${counts[2]}, variations: ${counts[3]}, add-ons: ${counts[4]}`);
  // eslint-disable-next-line no-console
  console.log(`  tables: ${counts[5]}, sections: ${counts[6]}, inventory items: ${counts[7]}, customers: ${counts[8]}`);
  // eslint-disable-next-line no-console
  console.log(`  recipes: ${counts[9]}, recipe ingredients: ${counts[10]}, suppliers: ${counts[11]}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });