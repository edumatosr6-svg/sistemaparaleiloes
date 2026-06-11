/**
 * Simplified validator for Schema.org types to ensure required fields for Rich Results are present.
 * Based on Google's Merchant and Search Console requirements.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSchema(type: string, data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (type) {
    case 'product':
      if (!data.name) errors.push("Product: 'name' is required.");
      if (!data.image) warnings.push("Product: 'image' is highly recommended for Rich Results.");
      if (!data.offers) errors.push("Product: 'offers' is required for Merchant listings.");
      if (data.offers && !data.offers.price) errors.push("Product Offers: 'price' is required.");
      break;

    case 'auction':
      if (!data.name) errors.push("Auction: 'name' is required.");
      if (!data.startDate) errors.push("Auction: 'startDate' is required.");
      if (!data.location && !data.url) warnings.push("Auction: 'location' or 'url' is recommended.");
      break;

    case 'faq':
      if (!data.mainEntity || !Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
        errors.push("FAQ: At least one 'Question' in 'mainEntity' is required.");
      } else {
        data.mainEntity.forEach((item: any, index: number) => {
          if (!item.name) errors.push(`FAQ Item ${index + 1}: 'name' (Question) is required.`);
          if (!item.acceptedAnswer || !item.acceptedAnswer.text) {
            errors.push(`FAQ Item ${index + 1}: 'acceptedAnswer.text' (Answer) is required.`);
          }
        });
      }
      break;

    case 'breadcrumb':
      if (!data.itemListElement || !Array.isArray(data.itemListElement) || data.itemListElement.length === 0) {
        errors.push("BreadcrumbList: 'itemListElement' is required.");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
