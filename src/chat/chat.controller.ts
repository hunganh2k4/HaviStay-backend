import { Controller, Get, Post, Body, Param, UseGuards, Req, Put } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get('messages/:conversationId')
  getMessages(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.chatService.getMessages(conversationId, req.user.userId);
  }

  @Post('send')
  sendMessage(@Req() req: any, @Body() body: { receiverId: string; content: string }) {
    return this.chatService.sendMessage(req.user.userId, body.receiverId, body.content);
  }

  @Get('find-or-create/:partnerId')
  findOrCreateConversation(@Req() req: any, @Param('partnerId') partnerId: string) {
    return this.chatService.findOrCreateConversation(req.user.userId, partnerId);
  }

  @Put('read/:conversationId')
  markAsRead(@Param('conversationId') conversationId: string, @Req() req: any) {
    return this.chatService.markAsRead(conversationId, req.user.userId);
  }
}
