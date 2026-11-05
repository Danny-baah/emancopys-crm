"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, canManageCustomer } from "@/lib/auth-utils";
import { activitySchema, type ActivityFormValues } from "@/lib/validations/customer";

export async function createActivity(customerId: string, formData: ActivityFormValues) {
  const user = await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  if (!canManageCustomer(user, customer)) {
    throw new Error("FORBIDDEN_ACTIVITY_CREATION");
  }

  const validated = activitySchema.parse(formData);

  const activity = await prisma.customerActivity.create({
    data: {
      customerId,
      userId: user.id,
      activityType: validated.activityType,
      title: validated.title,
      description: validated.description,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/dashboard");

  return { success: true, activity };
}
