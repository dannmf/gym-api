import { InMemoryCheckInsRepository } from "@/repositories/in-memory/in-memory-check-ins-repository";
import { InMemoryGymsRepository } from "@/repositories/in-memory/in-memory-gyms-repository";
import { MaxDistanceError } from "@/use-cases/errors/max-distance-error";
import { MaxNumberOfCheckInsError } from "@/use-cases/errors/max-number-of-check-ins-error";
import { CheckInUseCase } from "@/use-cases/users/check-in";
import { Decimal } from "@prisma/client/runtime/library";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

let checkInsRepository: InMemoryCheckInsRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('CheckInUseCase', () => {
    beforeEach(() => {
        checkInsRepository = new InMemoryCheckInsRepository()
        gymsRepository = new InMemoryGymsRepository()
        sut = new CheckInUseCase(checkInsRepository, gymsRepository)
        vi.useFakeTimers()

        gymsRepository.create({
            id: 'gym-01',
            title: 'Sportzone',
            description: '',
            phone: '',
            latitude: new Decimal(0),
            longitude: new Decimal(0),
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should be able to check in', async () => {
       
        const {checkIn} = await sut.execute({
            gymId: 'gym-01',
            userId: 'user-01',
            userLatitude: 0,
            userLongitude: 0,
        })
        expect(checkIn.id).toEqual(expect.any(String))
    })
    it('should not be able to check in twice in the same day', async () => {
        vi.setSystemTime(new Date(2022, 0, 20, 8,0,0))
        await sut.execute({
            gymId: 'gym-01',
            userId: 'user-01',
            userLatitude: 0,
            userLongitude: 0,
        })

        expect(() => sut.execute({
            gymId: 'gym-01',
            userId: 'user-01',
            userLatitude: 0,
            userLongitude: 0,
        })).rejects.toBeInstanceOf(MaxNumberOfCheckInsError)
    })

    it('should not be able to check in twice but in different days', async () => {
        vi.setSystemTime(new Date(2022, 0, 20, 8,0,0))

        await sut.execute({
            gymId: 'gym-01',
            userId: 'user-01',
            userLatitude: 0,
            userLongitude: 0,
        })
        vi.setSystemTime(new Date(2022, 0, 21, 8,0,0))
        
        const {checkIn} = await sut.execute({
            gymId: 'gym-01',
            userId: 'user-01',
            userLatitude: 0,
            userLongitude: 0,
        
    })
    expect(checkIn.id).toEqual(expect.any(String))
    })

    it('should not be able to check in on distant gym', async () => {
        gymsRepository.items.push({
            id: 'gym-02',
            title: 'Coliseu',
            description: '',
            phone: '',
            latitude: new Decimal(1),
            longitude: new Decimal(2),

        })

        vi.setSystemTime(new Date(2022, 0, 20, 8,0,0))
        
     await expect(() => sut.execute({
            gymId: 'gym-02',
            userId: 'user-01',
            userLatitude: -27.2092052,
            userLongitude: -49.6401091,
        })).rejects.toBeInstanceOf(MaxDistanceError)
    })
})
	