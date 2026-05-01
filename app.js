const STORAGE_KEY = "pantry-planner-state-v1";

const recipes = [
  {
    name: "Chicken Rice Bowls",
    slot: ["Lunch", "Dinner"],
    ingredients: ["chicken", "rice", "broccoli", "soy sauce", "garlic"],
    categories: { chicken: "Protein", rice: "Grain", broccoli: "Vegetable", "soy sauce": "Pantry", garlic: "Vegetable" },
  },
  {
    name: "Black Bean Tacos",
    slot: ["Lunch", "Dinner"],
    ingredients: ["black beans", "tortillas", "cheese", "lettuce", "salsa"],
    categories: { "black beans": "Pantry", tortillas: "Grain", cheese: "Dairy", lettuce: "Vegetable", salsa: "Pantry" },
  },
  {
    name: "Spinach Omelet",
    slot: ["Breakfast", "Lunch"],
    ingredients: ["eggs", "spinach", "cheese", "onion"],
    categories: { eggs: "Protein", spinach: "Vegetable", cheese: "Dairy", onion: "Vegetable" },
  },
  {
    name: "Pasta Marinara",
    slot: ["Lunch", "Dinner"],
    ingredients: ["pasta", "pasta sauce", "garlic", "parmesan"],
    categories: { pasta: "Grain", "pasta sauce": "Pantry", garlic: "Vegetable", parmesan: "Dairy" },
  },
  {
    name: "Coconut Chickpea Curry",
    slot: ["Dinner"],
    ingredients: ["chickpeas", "coconut milk", "rice", "spinach", "curry powder"],
    categories: { chickpeas: "Pantry", "coconut milk": "Pantry", rice: "Grain", spinach: "Vegetable", "curry powder": "Spice" },
  },
  {
    name: "Turkey Sandwich Plates",
    slot: ["Lunch"],
    ingredients: ["turkey", "bread", "cheese", "lettuce", "tomato"],
    categories: { turkey: "Protein", bread: "Grain", cheese: "Dairy", lettuce: "Vegetable", tomato: "Vegetable" },
  },
  {
    name: "Veggie Fried Rice",
    slot: ["Lunch", "Dinner"],
    ingredients: ["rice", "eggs", "peas", "carrots", "soy sauce"],
    categories: { rice: "Grain", eggs: "Protein", peas: "Vegetable", carrots: "Vegetable", "soy sauce": "Pantry" },
  },
  {
    name: "Yogurt Berry Bowls",
    slot: ["Breakfast"],
    ingredients: ["greek yogurt", "berries", "granola", "honey"],
    categories: { "greek yogurt": "Dairy", berries: "Fruit", granola: "Pantry", honey: "Pantry" },
  },
  {
    name: "Loaded Baked Potatoes",
    slot: ["Dinner"],
    ingredients: ["potatoes", "cheese", "broccoli", "sour cream"],
    categories: { potatoes: "Vegetable", cheese: "Dairy", broccoli: "Vegetable", "sour cream": "Dairy" },
  },
  {
    name: "Tomato Soup and Grilled Cheese",
    slot: ["Lunch", "Dinner"],
    ingredients: ["tomato soup", "bread", "cheese", "butter"],
    categories: { "tomato soup": "Pantry", bread: "Grain", cheese: "Dairy", butter: "Dairy" },
  },
  {
    name: "Salmon Quinoa Bowls",
    slot: ["Dinner"],
    ingredients: ["salmon", "quinoa", "cucumber", "lemon", "greek yogurt"],
    categories: { salmon: "Protein", quinoa: "Grain", cucumber: "Vegetable", lemon: "Fruit", "greek yogurt": "Dairy" },
  },
  {
    name: "Peanut Noodles",
    slot: ["Lunch", "Dinner"],
    ingredients: ["noodles", "peanut butter", "soy sauce", "carrots", "cucumber"],
    categories: { noodles: "Grain", "peanut butter": "Pantry", "soy sauce": "Pantry", carrots: "Vegetable", cucumber: "Vegetable" },
  },
];

const demoIngredients = [
  ["rice", "4 cups", "Grain"],
  ["black beans", "2 cans", "Pantry"],
  ["pasta", "1 box", "Grain"],
  ["eggs", "1 dozen", "Protein"],
  ["broccoli", "1 bag", "Vegetable"],
  ["garlic", "1 bulb", "Vegetable"],
  ["onion", "2", "Vegetable"],
  ["soy sauce", "1 bottle", "Pantry"],
  ["peanut butter", "1 jar", "Pantry"],
  ["curry powder", "1 tin", "Spice"],
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealSlots = {
  1: ["Dinner"],
  2: ["Lunch", "Dinner"],
  3: ["Breakfast", "Lunch", "Dinner"],
};

let state = {
  ingredients: [],
  filter: "All",
  schedule: [],
  groceries: [],
};

const els = {
  form: document.querySelector("#ingredientForm"),
  name: document.querySelector("#ingredientName"),
  amount: document.querySelector("#ingredientAmount"),
  category: document.querySelector("#ingredientCategory"),
  list: document.querySelector("#ingredientList"),
  count: document.querySelector("#inventoryCount"),
  filters: document.querySelectorAll(".filter-button"),
  generate: document.querySelector("#generateBtn"),
  schedule: document.querySelector("#schedule"),
  groceries: document.querySelector("#groceryList"),
  empty: document.querySelector("#emptyState"),
  mealsPerDay: document.querySelector("#mealsPerDay"),
  extraLimit: document.querySelector("#extraLimit"),
  extraLimitLabel: document.querySelector("#extraLimitLabel"),
  copy: document.querySelector("#copyListBtn"),
  clear: document.querySelector("#clearBtn"),
  seed: document.querySelector("#seedDemoBtn"),
  print: document.querySelector("#printBtn"),
};

function normalize(value) {
  return value.trim().toLowerCase();
}

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    state = { ...state, ...JSON.parse(raw) };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function ingredientNames() {
  return new Set(state.ingredients.map((item) => normalize(item.name)));
}

function scoreRecipe(recipe, slot, extraLimit) {
  if (!recipe.slot.includes(slot)) return null;

  const have = ingredientNames();
  const missing = recipe.ingredients.filter((item) => !have.has(normalize(item)));
  if (missing.length > extraLimit) return null;

  return {
    ...recipe,
    missing,
    score: recipe.ingredients.length - missing.length,
  };
}

function generateSchedule() {
  const slots = mealSlots[els.mealsPerDay.value];
  const extraLimit = Number(els.extraLimit.value);
  const usedCounts = new Map();

  const schedule = days.map((day) => {
    const meals = slots.map((slot) => {
      const options = recipes
        .map((recipe) => scoreRecipe(recipe, slot, extraLimit))
        .filter(Boolean)
        .sort((a, b) => {
          const usedDiff = (usedCounts.get(a.name) || 0) - (usedCounts.get(b.name) || 0);
          if (usedDiff !== 0) return usedDiff;
          return b.score - a.score || a.missing.length - b.missing.length;
        });

      const selected = options[0] || {
        name: "Pantry clean-out plate",
        ingredients: state.ingredients.slice(0, 5).map((item) => item.name),
        missing: [],
        categories: {},
      };

      usedCounts.set(selected.name, (usedCounts.get(selected.name) || 0) + 1);
      return { slot, ...selected };
    });

    return { day, meals };
  });

  state.schedule = schedule;
  state.groceries = buildGroceries(schedule);
  save();
  render();
}

function buildGroceries(schedule) {
  const groceryMap = new Map();

  schedule.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.missing.forEach((item) => {
        const key = normalize(item);
        const current = groceryMap.get(key) || {
          name: item,
          category: meal.categories[item] || "Other",
          meals: new Set(),
        };
        current.meals.add(meal.name);
        groceryMap.set(key, current);
      });
    });
  });

  return [...groceryMap.values()].map((item) => ({
    ...item,
    meals: [...item.meals],
  }));
}

function renderIngredients() {
  const visible = state.filter === "All"
    ? state.ingredients
    : state.ingredients.filter((item) => item.category === state.filter);

  els.count.textContent = `${state.ingredients.length} item${state.ingredients.length === 1 ? "" : "s"}`;
  els.list.innerHTML = "";

  if (!visible.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = state.ingredients.length ? "No ingredients in this category yet." : "Your pantry is ready for its first ingredient.";
    els.list.append(empty);
    return;
  }

  visible.forEach((item) => {
    const li = document.createElement("li");
    li.className = "ingredient-item";
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <small>${item.amount || "Amount not set"} · ${item.category}</small>
      </div>
      <button class="remove-button" type="button" data-id="${item.id}" aria-label="Remove ${item.name}">Remove</button>
    `;
    els.list.append(li);
  });
}

function renderSchedule() {
  els.schedule.innerHTML = "";
  els.empty.style.display = state.schedule.length ? "none" : "flex";

  state.schedule.forEach((day) => {
    const card = document.createElement("article");
    card.className = "day-card";
    card.innerHTML = `<h3>${day.day}</h3>`;

    day.meals.forEach((meal) => {
      const row = document.createElement("div");
      row.className = "meal-row";
      const pantryItems = meal.ingredients.filter((item) => !meal.missing.includes(item));
      row.innerHTML = `
        <div class="meal-slot">${meal.slot}</div>
        <div>
          <div class="meal-name">${meal.name}</div>
          <div class="meal-meta">Uses: ${pantryItems.join(", ") || "your available pantry items"}</div>
          <div class="meal-meta missing">Missing: ${meal.missing.join(", ") || "nothing"}</div>
        </div>
      `;
      card.append(row);
    });

    els.schedule.append(card);
  });
}

function renderGroceries() {
  els.groceries.innerHTML = "";
  const grouped = state.groceries.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryOrder = ["Produce", "Protein", "Dairy", "Grain", "Pantry", "Spice", "Other"];
  const normalizedGroups = Object.entries(grouped).reduce((acc, [category, items]) => {
    const cleanCategory = ["Vegetable", "Fruit"].includes(category) ? "Produce" : category;
    acc[cleanCategory] = [...(acc[cleanCategory] || []), ...items];
    return acc;
  }, {});

  if (!state.groceries.length) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = state.schedule.length ? "No extra groceries needed for this plan." : "Generate a meal schedule to build your list.";
    els.groceries.append(item);
    return;
  }

  categoryOrder
    .filter((category) => normalizedGroups[category]?.length)
    .forEach((category) => {
      const section = document.createElement("li");
      section.className = "grocery-section";
      section.innerHTML = `<h3>${category}</h3>`;
      const list = document.createElement("ul");
      normalizedGroups[category].forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="checkbox" aria-hidden="true"></span>
          <span><strong>${item.name}</strong><br><small>For ${item.meals.join(", ")}</small></span>
        `;
        list.append(li);
      });
      section.append(list);
      els.groceries.append(section);
    });
}

function render() {
  renderIngredients();
  renderSchedule();
  renderGroceries();

  els.filters.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function groceryText() {
  const date = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const lines = [`PANTRY PLANNER`, `Grocery List`, date, ""];
  const grouped = state.groceries.reduce((acc, item) => {
    const category = ["Vegetable", "Fruit"].includes(item.category) ? "Produce" : item.category;
    acc[category] = acc[category] || [];
    acc[category].push(item);
    return acc;
  }, {});

  Object.keys(grouped).sort().forEach((category) => {
    lines.push(category);
    grouped[category].forEach((item) => lines.push(`[ ] ${item.name} - ${item.meals.join(", ")}`));
    lines.push("");
  });

  return lines.join("\n");
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.name.value.trim();
  if (!name) return;

  state.ingredients.push({
    id: makeId(),
    name,
    amount: els.amount.value.trim(),
    category: els.category.value,
  });

  els.form.reset();
  els.category.value = "Protein";
  save();
  render();
});

els.list.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-button");
  if (!button) return;

  state.ingredients = state.ingredients.filter((item) => item.id !== button.dataset.id);
  state.schedule = [];
  state.groceries = [];
  save();
  render();
});

els.filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    save();
    render();
  });
});

els.generate.addEventListener("click", generateSchedule);

els.extraLimit.addEventListener("input", () => {
  els.extraLimitLabel.textContent = els.extraLimit.value;
});

els.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(groceryText());
  els.copy.textContent = "Copied";
  setTimeout(() => {
    els.copy.textContent = "Copy";
  }, 1300);
});

els.clear.addEventListener("click", () => {
  if (!confirm("Clear all pantry ingredients and meal plans?")) return;
  state = { ingredients: [], filter: "All", schedule: [], groceries: [] };
  localStorage.removeItem(STORAGE_KEY);
  render();
});

els.seed.addEventListener("click", () => {
  state.ingredients = demoIngredients.map(([name, amount, category]) => ({
    id: makeId(),
    name,
    amount,
    category,
  }));
  state.schedule = [];
  state.groceries = [];
  save();
  render();
});

els.print.addEventListener("click", () => {
  if (!state.groceries.length && state.ingredients.length) {
    generateSchedule();
  }
  window.print();
});

load();
els.extraLimitLabel.textContent = els.extraLimit.value;
render();
