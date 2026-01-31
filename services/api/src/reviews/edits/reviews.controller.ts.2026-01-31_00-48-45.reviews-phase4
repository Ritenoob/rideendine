import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/user.interface';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.sub, dto);
  }

  @Get()
  async listByReviewee(
    @Query('revieweeId') revieweeId?: string,
    @Query('revieweeType') revieweeType?: 'chef' | 'driver',
  ) {
    return this.reviewsService.listReviews(revieweeId, revieweeType);
  }

  @Get('order/:orderId')
  async listByOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.listByOrder(orderId);
  }
}
