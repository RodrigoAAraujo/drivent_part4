import { Booking } from "@prisma/client"
import Joi from "joi";

type bookingReceiving = Omit<Booking, "id"| "userId" | "createdAt" | "updatedAt" >

export const bookingSchema = Joi.object<bookingReceiving>({
    roomId: Joi.number().required()
});
  

