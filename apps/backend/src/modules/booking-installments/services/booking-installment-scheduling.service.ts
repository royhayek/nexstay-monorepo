import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InstallmentType, InstallmentScheduleType } from '../../../common/enums/installment.enums';

export interface InstallmentScheduleItem {
  installmentNumber: number;
  amount: number;
  currency: string;
  dueDate: Date;
  type: InstallmentType;
  percentage: number;
}

@Injectable()
export class BookingInstallmentSchedulingService {
  createSchedule(
    scheduleType: InstallmentScheduleType,
    totalAmount: number,
    currency: string,
    numberOfInstallments: number,
    checkInDate: Date,
  ): InstallmentScheduleItem[] {
    switch (scheduleType) {
      case InstallmentScheduleType.PERCENTAGE_BASED:
        return this.createPercentageBasedSchedule(totalAmount, currency, checkInDate);
      case InstallmentScheduleType.EQUAL_MONTHLY:
        return this.createEqualMonthlySchedule(
          totalAmount,
          currency,
          numberOfInstallments,
          checkInDate,
        );
      case InstallmentScheduleType.FRONTLOADED:
        return this.createFrontloadedSchedule(totalAmount, currency, checkInDate);
      case InstallmentScheduleType.CHECKOUT_HEAVY:
        return this.createCheckoutHeavySchedule(totalAmount, currency, checkInDate);
      default:
        return this.createPercentageBasedSchedule(totalAmount, currency, checkInDate);
    }
  }

  createCustomSchedule(
    totalAmount: number,
    currency: string,
    customSchedule: {
      installmentNumber: number;
      percentage: number;
      dueDate: Date;
      type: InstallmentType;
    }[],
  ): InstallmentScheduleItem[] {
    return customSchedule.map((item) => ({
      installmentNumber: item.installmentNumber,
      amount: Math.round(((totalAmount * item.percentage) / 100) * 100) / 100,
      currency,
      dueDate: item.dueDate,
      type: item.type,
      percentage: item.percentage,
    }));
  }

  private createPercentageBasedSchedule(
    totalAmount: number,
    currency: string,
    checkInDate: Date,
  ): InstallmentScheduleItem[] {
    const schedule: InstallmentScheduleItem[] = [];
    const now = DateUtils.now();

    // 50% initial payment (due immediately)
    schedule.push({
      installmentNumber: 1,
      amount: Math.round(totalAmount * 0.5 * 100) / 100,
      currency,
      dueDate: now,
      type: InstallmentType.INITIAL,
      percentage: 50,
    });

    // 30% second payment (due 30 days before check-in or halfway point)
    const secondPaymentDate = DateUtils.create(checkInDate);
    secondPaymentDate.setDate(secondPaymentDate.getDate() - 30);
    if (secondPaymentDate <= now) {
      secondPaymentDate.setDate(now.getDate() + 7); // 7 days from now if too close
    }

    schedule.push({
      installmentNumber: 2,
      amount: Math.round(totalAmount * 0.3 * 100) / 100,
      currency,
      dueDate: secondPaymentDate,
      type: InstallmentType.MONTHLY,
      percentage: 30,
    });

    // 20% final payment (due 7 days before check-in)
    const finalPaymentDate = DateUtils.create(checkInDate);
    finalPaymentDate.setDate(finalPaymentDate.getDate() - 7);
    if (finalPaymentDate <= secondPaymentDate) {
      finalPaymentDate.setDate(secondPaymentDate.getDate() + 1); // Day after second payment
    }

    schedule.push({
      installmentNumber: 3,
      amount: totalAmount - schedule[0].amount - schedule[1].amount, // Remainder to handle rounding
      currency,
      dueDate: finalPaymentDate,
      type: InstallmentType.FINAL,
      percentage: 20,
    });

    return schedule;
  }

  private createEqualMonthlySchedule(
    totalAmount: number,
    currency: string,
    numberOfInstallments: number,
    checkInDate: Date,
  ): InstallmentScheduleItem[] {
    const schedule: InstallmentScheduleItem[] = [];
    const installmentAmount = Math.round((totalAmount / numberOfInstallments) * 100) / 100;
    const now = DateUtils.now();

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = DateUtils.create(now);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Ensure last payment is before check-in
      if (i === numberOfInstallments - 1) {
        const checkInBuffer = DateUtils.create(checkInDate);
        checkInBuffer.setDate(checkInBuffer.getDate() - 7);
        if (dueDate > checkInBuffer) {
          dueDate.setTime(checkInBuffer.getTime());
        }
      }

      schedule.push({
        installmentNumber: i + 1,
        amount:
          i === numberOfInstallments - 1
            ? totalAmount - installmentAmount * (numberOfInstallments - 1) // Last payment handles remainder
            : installmentAmount,
        currency,
        dueDate,
        type:
          i === 0
            ? InstallmentType.INITIAL
            : i === numberOfInstallments - 1
              ? InstallmentType.FINAL
              : InstallmentType.MONTHLY,
        percentage: Math.round((100 / numberOfInstallments) * 100) / 100,
      });
    }

    return schedule;
  }

  private createFrontloadedSchedule(
    totalAmount: number,
    currency: string,
    checkInDate: Date,
  ): InstallmentScheduleItem[] {
    const schedule: InstallmentScheduleItem[] = [];
    const now = DateUtils.now();

    // 70% initial payment
    schedule.push({
      installmentNumber: 1,
      amount: Math.round(totalAmount * 0.7 * 100) / 100,
      currency,
      dueDate: now,
      type: InstallmentType.INITIAL,
      percentage: 70,
    });

    // 30% final payment
    const finalPaymentDate = DateUtils.create(checkInDate);
    finalPaymentDate.setDate(finalPaymentDate.getDate() - 7);

    schedule.push({
      installmentNumber: 2,
      amount: totalAmount - schedule[0].amount,
      currency,
      dueDate: finalPaymentDate,
      type: InstallmentType.FINAL,
      percentage: 30,
    });

    return schedule;
  }

  private createCheckoutHeavySchedule(
    totalAmount: number,
    currency: string,
    checkInDate: Date,
  ): InstallmentScheduleItem[] {
    const schedule: InstallmentScheduleItem[] = [];
    const now = DateUtils.now();

    // 30% initial payment
    schedule.push({
      installmentNumber: 1,
      amount: Math.round(totalAmount * 0.3 * 100) / 100,
      currency,
      dueDate: now,
      type: InstallmentType.INITIAL,
      percentage: 30,
    });

    // 70% final payment
    const finalPaymentDate = DateUtils.create(checkInDate);
    finalPaymentDate.setDate(finalPaymentDate.getDate() - 7);

    schedule.push({
      installmentNumber: 2,
      amount: totalAmount - schedule[0].amount,
      currency,
      dueDate: finalPaymentDate,
      type: InstallmentType.FINAL,
      percentage: 70,
    });

    return schedule;
  }
}
