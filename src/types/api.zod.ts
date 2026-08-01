import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const postMeal_plansMeal_plan_idmeal_plan_entries_Body = z
  .object({
    meal_plan_entry: z
      .object({
        recipe_id: z.number().int(),
        day_of_week: z.number().int().gte(0).lte(6),
        meal_type: z.enum(["breakfast", "lunch", "dinner"]),
        servings_multiplier: z.number().optional(),
        batch_source_entry_id: z.number().int().nullish(),
      })
      .passthrough(),
  })
  .passthrough();
const MealPlanEntry = z
  .object({
    id: z.number().int(),
    meal_plan_id: z.number().int().optional(),
    recipe_id: z.number().int(),
    day_of_week: z.number().int().gte(0).lte(6),
    meal_type: z.enum(["breakfast", "lunch", "dinner"]),
    servings_multiplier: z.string(),
    batch_source_entry_id: z.number().int().nullish(),
    recipe: z
      .object({ id: z.number().int(), title: z.string() })
      .passthrough()
      .optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    updated_at: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const patchMeal_plan_entriesId_Body = z
  .object({
    meal_plan_entry: z
      .object({
        recipe_id: z.number().int(),
        day_of_week: z.number().int(),
        meal_type: z.enum(["breakfast", "lunch", "dinner"]),
        servings_multiplier: z.number(),
        batch_source_entry_id: z.number().int().nullable(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const MealPlan = z
  .object({
    id: z.number().int(),
    user_id: z.number().int(),
    week_start_date: z.string(),
    status: z.enum(["draft", "active", "archived"]),
    meal_plan_entries: z.array(MealPlanEntry).optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough();
const postMeal_plans_Body = z
  .object({
    meal_plan: z
      .object({
        week_start_date: z.string(),
        status: z.enum(["draft", "active", "archived"]).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const patchMeal_plansId_Body = z
  .object({
    meal_plan: z
      .object({ status: z.enum(["draft", "active", "archived"]) })
      .passthrough(),
  })
  .passthrough();
const PantryItem = z
  .object({
    id: z.number().int(),
    user_id: z.number().int(),
    ingredient_id: z.number().int(),
    is_staple: z.boolean(),
    status: z.enum(["have", "running_low", "out"]),
    last_confirmed_at: z.string().datetime({ offset: true }).nullish(),
    ingredient: z
      .object({ id: z.number().int(), name: z.string() })
      .passthrough()
      .optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough();
const postPantry_items_Body = z
  .object({
    pantry_item: z
      .object({
        ingredient_id: z.number().int(),
        name: z.string(),
        status: z.enum(["have", "running_low", "out"]),
        is_staple: z.boolean(),
        last_confirmed_at: z.string().datetime({ offset: true }).nullable(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const patchPantry_itemsId_Body = z
  .object({
    pantry_item: z
      .object({
        status: z.enum(["have", "running_low", "out"]),
        is_staple: z.boolean(),
        last_confirmed_at: z.string().datetime({ offset: true }).nullable(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const RecipeIngredient = z
  .object({
    id: z.number().int(),
    ingredient_id: z.number().int(),
    quantity: z.string(),
    unit: z.string(),
    notes: z.string().nullish(),
    is_optional: z.boolean(),
    ingredient: z
      .object({ id: z.number().int(), name: z.string() })
      .passthrough()
      .optional(),
  })
  .passthrough();
const Recipe = z
  .object({
    id: z.number().int(),
    user_id: z.number().int(),
    title: z.string(),
    source_type: z.string(),
    source_url: z.string().nullish(),
    instructions: z.string().nullish(),
    servings: z.number().int(),
    image_url: z.string().nullish(),
    tags: z.array(z.string()),
    recipe_ingredients: z.array(RecipeIngredient).optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough();
const postRecipes_Body = z
  .object({
    recipe: z
      .object({
        title: z.string(),
        source_type: z.string().optional(),
        source_url: z.string().nullish(),
        instructions: z.string().nullish(),
        servings: z.number().int().optional(),
        image_url: z.string().nullish(),
        tags: z.array(z.string()).optional(),
        recipe_ingredients_attributes: z
          .array(
            z
              .object({
                name: z.string(),
                quantity: z.number(),
                unit: z.string(),
                notes: z.string().nullish(),
                is_optional: z.boolean().optional(),
              })
              .passthrough()
          )
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
const patchRecipesId_Body = z
  .object({
    recipe: z
      .object({
        title: z.string(),
        instructions: z.string().nullable(),
        servings: z.number().int(),
        tags: z.array(z.string()),
        recipe_ingredients_attributes: z.array(
          z
            .object({
              id: z.number().int(),
              name: z.string(),
              quantity: z.number(),
              unit: z.string(),
              notes: z.string().nullable(),
              is_optional: z.boolean(),
              _destroy: z.boolean(),
            })
            .partial()
            .passthrough()
        ),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const patchShopping_list_itemsId_Body = z
  .object({
    shopping_list_item: z
      .object({
        is_checked: z.boolean(),
        excluded_reason: z.string().nullable(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const ShoppingListItem = z
  .object({
    id: z.number().int(),
    ingredient_id: z.number().int(),
    quantity: z.string(),
    unit: z.string(),
    source: z.enum(["recipe", "manual", "staple_replenish"]),
    is_checked: z.boolean(),
    excluded_reason: z.string().nullish(),
    ingredient: z
      .object({ id: z.number().int(), name: z.string() })
      .passthrough()
      .optional(),
  })
  .passthrough();
const postShopping_listsShopping_list_idshopping_list_items_Body = z
  .object({
    shopping_list_item: z
      .object({
        ingredient_id: z.number().int().optional(),
        name: z.string().optional(),
        quantity: z.number(),
        unit: z.string(),
        excluded_reason: z.string().nullish(),
        is_checked: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();
const ShoppingList = z
  .object({
    id: z.number().int(),
    user_id: z.number().int(),
    meal_plan_id: z.number().int(),
    week_start_date: z.string(),
    status: z.enum(["draft", "finalized", "ordered"]),
    shopping_list_items: z.array(ShoppingListItem).optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  postMeal_plansMeal_plan_idmeal_plan_entries_Body,
  MealPlanEntry,
  patchMeal_plan_entriesId_Body,
  MealPlan,
  postMeal_plans_Body,
  patchMeal_plansId_Body,
  PantryItem,
  postPantry_items_Body,
  patchPantry_itemsId_Body,
  RecipeIngredient,
  Recipe,
  postRecipes_Body,
  patchRecipesId_Body,
  patchShopping_list_itemsId_Body,
  ShoppingListItem,
  postShopping_listsShopping_list_idshopping_list_items_Body,
  ShoppingList,
};

const endpoints = makeApi([
  {
    method: "patch",
    path: "/meal_plan_entries/:id",
    alias: "patchMeal_plan_entriesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchMeal_plan_entriesId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MealPlanEntry,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/meal_plan_entries/:id",
    alias: "deleteMeal_plan_entriesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/meal_plans",
    alias: "getMeal_plans",
    requestFormat: "json",
    response: z.array(MealPlan),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/meal_plans",
    alias: "postMeal_plans",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postMeal_plans_Body,
      },
    ],
    response: MealPlan,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `not a Monday`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/meal_plans/:id",
    alias: "getMeal_plansId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MealPlan,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/meal_plans/:id",
    alias: "patchMeal_plansId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchMeal_plansId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MealPlan,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `invalid status`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/meal_plans/:meal_plan_id/meal_plan_entries",
    alias: "postMeal_plansMeal_plan_idmeal_plan_entries",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postMeal_plansMeal_plan_idmeal_plan_entries_Body,
      },
      {
        name: "meal_plan_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: MealPlanEntry,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `invalid meal type`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/meal_plans/:meal_plan_id/shopping_list",
    alias: "postMeal_plansMeal_plan_idshopping_list",
    requestFormat: "json",
    parameters: [
      {
        name: "meal_plan_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ShoppingList,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/meal_plans/:meal_plan_id/shopping_list",
    alias: "getMeal_plansMeal_plan_idshopping_list",
    requestFormat: "json",
    parameters: [
      {
        name: "meal_plan_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ShoppingList,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `not generated yet`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/pantry_items",
    alias: "getPantry_items",
    requestFormat: "json",
    response: z.array(PantryItem),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/pantry_items",
    alias: "postPantry_items",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postPantry_items_Body,
      },
    ],
    response: PantryItem,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `duplicate ingredient`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/pantry_items/:id",
    alias: "patchPantry_itemsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchPantry_itemsId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: PantryItem,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/pantry_items/:id",
    alias: "deletePantry_itemsId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/recipes",
    alias: "getRecipes",
    requestFormat: "json",
    response: z.array(Recipe),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/recipes",
    alias: "postRecipes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postRecipes_Body,
      },
    ],
    response: Recipe,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `invalid request`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/recipes/:id",
    alias: "getRecipesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: Recipe,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `not found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/recipes/:id",
    alias: "patchRecipesId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchRecipesId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: Recipe,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "delete",
    path: "/recipes/:id",
    alias: "deleteRecipesId",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `recipe in use`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "patch",
    path: "/shopping_list_items/:id",
    alias: "patchShopping_list_itemsId",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: patchShopping_list_itemsId_Body,
      },
      {
        name: "id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ShoppingListItem,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/shopping_lists/:shopping_list_id/shopping_list_items",
    alias: "postShopping_listsShopping_list_idshopping_list_items",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: postShopping_listsShopping_list_idshopping_list_items_Body,
      },
      {
        name: "shopping_list_id",
        type: "Path",
        schema: z.number().int(),
      },
    ],
    response: ShoppingListItem,
    errors: [
      {
        status: 401,
        description: `unauthorized`,
        schema: z.void(),
      },
      {
        status: 422,
        description: `missing quantity`,
        schema: z.void(),
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
