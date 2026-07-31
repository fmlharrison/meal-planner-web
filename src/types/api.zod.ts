import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

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
      })
      .passthrough(),
  })
  .passthrough();

export const schemas = {
  Recipe,
  postRecipes_Body,
};

const endpoints = makeApi([
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
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
