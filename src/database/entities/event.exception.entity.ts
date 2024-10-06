import { EventEntity } from 'src/database/entities/event.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'event_exception' })
export class EventExceptionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'is_rescheduled', type: 'boolean' })
    isRescheduled: boolean;

    @Column({ name: 'is_cancelled', type: 'boolean' })
    isCancelled: boolean;

    @Column({ name: 'original_date', type: 'datetime' })
    originalDate: Date;

    @Column({ nullable: true, name: 'start_date', type: 'datetime' })
    startDate?: Date;

    @Column({ nullable: true, name: 'end_date', type: 'datetime' })
    endDate?: Date;

    @Column({ name: 'is_full_day', type: 'boolean' })
    isFullDay: boolean;

    @Column({ name: 'event_id' })
    mainEventId: number;

    @ManyToOne(() => EventEntity, (event) => event.eventExceptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'event_id' })
    mainEvent: EventEntity;

    constructor(
        id: number,
        isRescheduled: boolean,
        isCancelled: boolean,
        originalDate: Date,
        startDate: Date,
        endDate: Date,
        isFullDay: boolean,
        mainEventId: number,
        mainEvent: EventEntity,
    ) {
        this.id = id;
        this.isRescheduled = isRescheduled;
        this.isCancelled = isCancelled;
        this.originalDate = originalDate;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isFullDay = isFullDay;
        this.mainEventId = mainEventId;
        this.mainEvent = mainEvent;
    }
}
