import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true },
        },
        participant2: {
          select: { id: true, name: true, avatar: true },
        },
        property: {
          select: { id: true, title: true, images: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Verify user is part of the conversation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: senderId, participant2Id: receiverId },
          { participant1Id: receiverId, participant2Id: senderId },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: senderId,
          participant2Id: receiverId,
        },
      });
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async findOrCreateConversation(user1Id: string, user2Id: string, propertyId?: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: user1Id, participant2Id: user2Id, propertyId: propertyId || null },
          { participant1Id: user2Id, participant2Id: user1Id, propertyId: propertyId || null },
        ],
      },
      include: {
        participant1: {
          select: { id: true, name: true, avatar: true },
        },
        participant2: {
          select: { id: true, name: true, avatar: true },
        },
        property: {
          select: { id: true, title: true, images: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id: user1Id,
          participant2Id: user2Id,
          propertyId: propertyId || null,
        },
        include: {
          participant1: {
            select: { id: true, name: true, avatar: true },
          },
          participant2: {
            select: { id: true, name: true, avatar: true },
          },
          property: {
            select: { id: true, title: true, images: true },
          },
          messages: true,
        },
      });
    }

    return conversation;
  }

  async markAsRead(conversationId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        conversation: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }
}
