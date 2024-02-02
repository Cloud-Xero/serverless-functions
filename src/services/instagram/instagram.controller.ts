import { Controller, Get, Post } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Controller()
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get()
  getMyFacebookPage() {
    return this.instagramService.getMyFacebookPage();
  }

  @Get()
  getBusinessAccount() {
    return this.instagramService.getBusinessAccount();
  }

  @Post()
  executePostingFeed() {
    return this.instagramService.executePostingFeed(imagePath, caption);
  }

  @Post()
  executePostingCarousel() {
    return this.instagramService.executePostingCarousel();
  }

  @Post()
  executePostingReel() {
    return this.instagramService.executePostingReel();
  }

  @Post()
  executePostingStories() {
    return this.instagramService.executePostingStories();
  }
}
