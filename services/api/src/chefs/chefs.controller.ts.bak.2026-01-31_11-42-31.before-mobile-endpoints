import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChefsService } from './chefs.service';
import { ApplyAsChefDto, UpdateChefDto, SearchChefsDto, UploadDocumentDto } from './dto/chef.dto';
import { StripeOnboardRequestDto } from '../stripe/dto/stripe.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, UserRole } from '../common/interfaces/user.interface';

@Controller('chefs')
export class ChefsController {
  constructor(private readonly chefsService: ChefsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async apply(@CurrentUser() user: JwtPayload, @Body() applyDto: ApplyAsChefDto) {
    return this.chefsService.applyAsChef(user.sub, applyDto);
  }

  @Get('search')
  async search(@Query() searchDto: SearchChefsDto) {
    return this.chefsService.searchChefs(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.chefsService.getChefById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateDto: UpdateChefDto,
  ) {
    return this.chefsService.updateChef(user.sub, id, updateDto);
  }

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chef-documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${req.params.id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return cb(new BadRequestException('Only PDF, JPG, and PNG files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileUrl = `/uploads/chef-documents/${file.filename}`;
    return this.chefsService.uploadDocument(user.sub, id, uploadDto.documentType, fileUrl);
  }

  @Post(':id/toggle-vacation-mode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async toggleVacationMode(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chefsService.toggleVacationMode(user.sub, id);
  }

  @Post(':id/stripe/onboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async initiateStripeOnboarding(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: StripeOnboardRequestDto,
  ) {
    return this.chefsService.initiateStripeOnboarding(
      user.sub,
      id,
      body.refreshUrl,
      body.returnUrl,
    );
  }

  @Get(':id/stripe/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getStripeStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chefsService.getStripeAccountStatus(user.sub, id);
  }
}
