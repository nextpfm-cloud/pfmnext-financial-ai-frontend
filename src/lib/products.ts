// The PFMNext products and which one this app is. The roles are the pfmnext-api client roles that
// grant entry (Ansible: finance_access_role / policy_access_role); the portal opens each product.
export type ProductKey = "fiscal" | "policy"

export const CURRENT_PRODUCT: ProductKey = "fiscal"

export const PRODUCTS: Record<ProductKey, { name: string; description: string; logo: string; role: string }> = {
  fiscal: { name: "Fiscal Mind", description: "Public financial data, trends and variances", logo: "/brand/fiscal-mind.svg", role: "finance-access" },
  policy: { name: "Policy Mind", description: "Policies, financial regulations and circulars", logo: "/brand/policy-mind.svg", role: "policy-access" },
}

export const PRODUCT_KEYS = Object.keys(PRODUCTS) as ProductKey[]

export const productsFromRoles = (roles: readonly string[]): ProductKey[] => PRODUCT_KEYS.filter((key) => roles.includes(PRODUCTS[key].role))
