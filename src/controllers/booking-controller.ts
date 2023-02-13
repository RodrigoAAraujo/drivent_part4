import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import {  Response } from "express";
import httpStatus from "http-status";


export async function getBooking(req: AuthenticatedRequest, res: Response){
    const { userId } = req;

    try{
        const  myBooking = await bookingService.getBooking(userId)
        return res.status(httpStatus.OK).send(myBooking)

    }catch(error){
        if(error.name === "NotFoundError"){
            return res.status(httpStatus.NOT_FOUND).send(error)
        }
    }
}

export async function postBooking(req: AuthenticatedRequest, res: Response){
    const { userId } = req;
    const { roomId } = req.body as {roomId: number}

    try{
        const bookingId = await bookingService.postBooking(userId, roomId)
        return res.status(httpStatus.OK).send({bookingId})

    }catch(error){
        if(error.name === "NotFoundError"){
            return res.status(httpStatus.NOT_FOUND).send(error)
        }
        else if(error.name === "ConflictError"){
            return res.status(httpStatus.FORBIDDEN).send(error)
        }
        else{
            return res.status(httpStatus.FORBIDDEN).send(error)
        }
    }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response){
    const { userId } = req;
    const { roomId } = req.body as {roomId: number}
    const { bookingId } = req.params


    try{
        const id = await bookingService.putBooking(userId, roomId, Number(bookingId))
        return res.status(httpStatus.OK).send({bookingId: id})

    }catch(error){
        if(error.name === "NotFoundError"){
            return res.status(httpStatus.NOT_FOUND).send(error)
        }
        if(error.name === "ConflictError"){
            return res.status(httpStatus.FORBIDDEN).send(error)
        }
        return res.status(httpStatus.FORBIDDEN).send(error)
    }
}