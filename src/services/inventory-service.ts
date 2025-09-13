
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';

/**
 * @fileOverview A service for managing inventory.
 */

/**
 * Updates the stock level for a given SKU for a specific user.
 * @param sku The SKU of the item to update.
 * @param quantityChange The amount to add or subtract from the stock.
 * @param ownerId The ID of the user who owns the inventory.
 * @returns A confirmation message.
 */
async function updateInventoryBySku(sku: string, quantityChange: number, ownerId: string): Promise<string> {
    const q = query(collection(db, 'inventory'), where('sku', '==', sku), where('ownerId', '==', ownerId));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return `Error: SKU "${sku}" not found for this user.`;
        }
        
        const itemDoc = querySnapshot.docs[0];
        const newStock = itemDoc.data().stock + quantityChange;

        if (quantityChange !== 0) { // Only update if there's a change
          await updateDoc(doc(db, 'inventory', itemDoc.id), {
            stock: increment(quantityChange)
          });
        }
        
        return `Stock for ${sku}. Current stock: ${newStock}.`;

    } catch (error) {
        console.error("Error updating inventory:", error);
        return `Failed to update stock for SKU "${sku}".`;
    }
}

// Define the AI Tool
export const updateStockLevel = ai.defineTool(
    {
        name: 'updateStockLevel',
        description: 'Updates the stock level of a product in the inventory based on its SKU. Use a negative number to decrease stock (e.g., for a sale) and a positive number to increase it (e.g., for a return or new shipment). Use a quantityChange of 0 to check current stock.',
        inputSchema: z.object({
            sku: z.string().describe('The unique Stock Keeping Unit (SKU) of the product.'),
            quantityChange: z.number().int().describe('The number of units to add (positive), remove (negative), or check (0) from the stock.'),
            ownerId: z.string().describe("The user ID of the data owner."),
        }),
        outputSchema: z.string(),
    },
    async (input) => {
        return await updateInventoryBySku(input.sku, input.quantityChange, input.ownerId);
    }
);
