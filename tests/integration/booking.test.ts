import app, { init } from "@/app";
import { createEnrollmentWithAddress, 
  createPayment, createUser, 
  createTicket, createTicketTypeWithHotel, 
  createHotel, createRoomWithHotelId, createTicketTypeRemote 
} from "../factories";
import httpStatus from "http-status";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import faker from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import {  TicketStatus } from "@prisma/client";
import { createBooking } from "../factories/booking-factory";
import { prisma } from "@/config";

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });



  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404)
    })

    it("should respond with status 200 and BODY when user has booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      await createBooking(user.id, room.id)

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: expect.any(Number),
        Room: expect.objectContaining({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId:  room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString()
        })
      })
    })
  })
})



describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 400 if body is incorrect", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({"erro": "its not right"})

      expect(response.status).toBe(400)
    })

    it("should respond with status 404 if roomId does not exist", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      await createRoomWithHotelId(hotel.id)

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: 0})

      expect(response.status).toBe(404)
    })

    it("should respond with status 403 if roomId is full", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 403 if roomId is full", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 403 if user has no enrollment", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 403 if ticket does not match requirements", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 403 if ticket was not paid", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 200 and BODY if everithing is correct", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      const bookingCheck = await prisma.booking.findFirst({
        where:{
          id: response.body.bookingId
        }
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({bookingId: expect.any(Number)})
      expect(bookingCheck).toEqual(expect.objectContaining({
        userId: user.id,
        roomId: room.id
      }))

    })
  })
})



describe("PUT /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });



  describe("when token is valid", () => {

    it("should respond with status 400 if body is incorrect", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const booking  = await createBooking(user.id, room.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({"erro": "its not right"})

      expect(response.status).toBe(400)
    })

    it("should respond with status 404 if bookingId is not found", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      await createBooking(user.id, room.id);

      const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(404)
    })

    it("should respond with status 404 if roomId does not exist", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const booking = await createBooking(user.id, room.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: 0})

      expect(response.status).toBe(404)
    })

    it("should respond with status 403 if roomId is full", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const room2 = await createRoomWithHotelId(hotel.id)

      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);

      const bookingBeChanged = await createBooking(user.id, room2.id);

      const response = await server.put(`/booking/${bookingBeChanged.id}`).set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 403 if booking owner is not you", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const user2 = await createUser();
      const token2 = await generateValidToken(user2);
      const enrollment2 = await createEnrollmentWithAddress(user2);
      const ticketType2 = await createTicketTypeWithHotel();
      const ticket2 = await createTicket(enrollment2.id, ticketType2.id, TicketStatus.PAID);
      await createPayment(ticket2.id, ticketType2.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const firstUserBooking = await createBooking(user.id, room.id);

      const response = await server.put(`/booking/${firstUserBooking.id}`).set("Authorization", `Bearer ${token2}`).send({roomId: room.id})

      expect(response.status).toBe(403)
    })

    it("should respond with status 200 and BODY if everithing is correct", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id)

      const booking  = await createBooking(user.id, room.id);

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: room.id})

      const bookingCheck = await prisma.booking.findFirst({
        where:{
          id: booking.id
        }
      })  

      expect(response.status).toBe(200)
      expect(response.body).toEqual({bookingId: expect.any(Number)})
      expect(bookingCheck.roomId).toEqual(room.id)

    })

  })
})