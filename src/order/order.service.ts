import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { INewOrder } from './interfaces/INewOrder';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name)
    constructor(
        private readonly httpService: HttpService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async findNew(): Promise<INewOrder> {
        const config = {
            headers: {
                'ORDERDESK-STORE-ID': process.env.STORE_ID,
                'ORDERDESK-API-KEY': process.env.API_KEYS
            }
        }

        const { data } = await firstValueFrom(
            this.httpService.get<any>('https://app.orderdesk.me/api/v2/orders', config).pipe(
                catchError((error: AxiosError) => {
                    throw 'Axios error' + error;
                })
            )
        )
        return this.filterNewOrder(data);
    }

    async filterNewOrder(data: any): Promise<INewOrder>{
        const newOrders = data.orders.filter((order: INewOrder) => order.folder_id === +process.env.FOLDER_NEW_ID).map(
            (order: INewOrder) => ({
                id: order.id,
                shipping: order.shipping,
            })
        )

        this.logger.log(`Нові замовлення:`);
        this.logger.log(newOrders);
        return newOrders;
    }
}
