import { conflictError, notFoundError, paymentRequired } from "@/errors"
import bookingRepository from "@/repositories/booking-repository"
import enrollmentRepository from "@/repositories/enrollment-repository"
import hotelRepository from "@/repositories/hotel-repository"
import ticketRepository from "@/repositories/ticket-repository"

async function getBooking(userId: number){
    const myBooking = await bookingRepository.getBookingByuserId(userId)

    if(!myBooking) throw notFoundError()

    return {id: myBooking.id, Room: myBooking.Room}
}

async function postBooking(userId: number, roomId: number){
    const room = await hotelRepository.findRoomById(roomId)
    if(!room) throw notFoundError()

    const bookings = await bookingRepository.getBookingsInGivenRoom(room.id)
    if( bookings.length >= room.capacity) throw conflictError("There are no more available schedules for this room")
    
    const {id: enrollmentId } = await enrollmentRepository.findByUserId(userId)
    if(!enrollmentId)  throw notFoundError()
    
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollmentId)
    if (!ticket || ticket.status === "RESERVED") throw paymentRequired()    
    if(!ticket.TicketType.includesHotel || ticket.TicketType.isRemote) throw conflictError("Ticket does not fulfill all the requirements")

    const booking = await bookingRepository.insertBooking(roomId, userId)

    return booking.id
}

async function putBooking(userId: number, roomId: number, bookingId: number){
    const bookingExist = await bookingRepository.getBooking(bookingId)
    if(!bookingExist) throw notFoundError()
    if(bookingExist.userId !== userId) throw conflictError("Booking owner does not match")

    const room = await hotelRepository.findRoomById(roomId)
    if(!room) throw notFoundError()

    const bookings = await bookingRepository.getBookingsInGivenRoom(room.id)
    if( bookings.length >= room.capacity) throw conflictError("There are no more available schedules for this room")

    const booking = await bookingRepository.updateBooking(roomId, bookingId)

    return booking.id
}

const bookingService = {
    getBooking,
    postBooking,
    putBooking
}

export default bookingService