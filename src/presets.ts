/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VocabItem, GrammarPuzzle } from './types';

export const DEFAULT_VOCAB_ITEMS: VocabItem[] = [
  {
    id: 'v1',
    vi: 'Xin chào',
    en: 'Hello / Greetings',
    topic: 'Chào hỏi (Greetings)',
    example: 'Xin chào, bạn khỏe không?',
    exampleEn: 'Hello, how are you?',
    memorized: false
  },
  {
    id: 'v2',
    vi: 'Cảm ơn',
    en: 'Thank you',
    topic: 'Chào hỏi (Greetings)',
    example: 'Cảm ơn bạn rất nhiều vì bữa tối ngon miệng.',
    exampleEn: 'Thank you very much for the delicious dinner.',
    memorized: false
  },
  {
    id: 'v3',
    vi: 'Tạm biệt',
    en: 'Goodbye',
    topic: 'Chào hỏi (Greetings)',
    example: 'Tạm biệt, hẹn gặp lại bạn tuần sau!',
    exampleEn: 'Goodbye, see you again next week!',
    memorized: false
  },
  {
    id: 'v4',
    vi: 'Gia đình',
    en: 'Family',
    topic: 'Gia đình (Family)',
    example: 'Gia đình tôi có bốn người.',
    exampleEn: 'My family has four people.',
    memorized: false
  },
  {
    id: 'v5',
    vi: 'Cha mẹ',
    en: 'Parents',
    topic: 'Gia đình (Family)',
    example: 'Tôi luôn tôn trọng và yêu quý cha mẹ mình.',
    exampleEn: 'I always respect and love my parents.',
    memorized: false
  },
  {
    id: 'v6',
    vi: 'Bánh mì',
    en: 'Vietnamese sandwich (Banh mi)',
    topic: 'Ẩm thực (Food & Dining)',
    example: 'Tôi muốn ăn một ổ bánh mì thịt nguội.',
    exampleEn: 'I want to eat a cold cut Banh mi.',
    memorized: false
  },
  {
    id: 'v7',
    vi: 'Ngon miệng',
    en: 'Delicious / Appetizing',
    topic: 'Ẩm thực (Food & Dining)',
    example: 'Chúc mọi người ăn ngon miệng!',
    exampleEn: 'Wish everyone a delicious meal / Bon appétit!',
    memorized: false
  },
  {
    id: 'v8',
    vi: 'Trường học',
    en: 'School',
    topic: 'Trường học (School)',
    example: 'Trường học của tôi rất đẹp và rộng rãi.',
    exampleEn: 'My school is very beautiful and spacious.',
    memorized: false
  },
  {
    id: 'v9',
    vi: 'Giáo viên',
    en: 'Teacher',
    topic: 'Trường học (School)',
    example: 'Cô Lan là một giáo viên rất tận tâm.',
    exampleEn: 'Ms. Lan is a very dedicated teacher.',
    memorized: false
  },
  {
    id: 'v10',
    vi: 'Du lịch',
    en: 'Travel / Tourism',
    topic: 'Du lịch (Travel)',
    example: 'Hè này chúng tôi sẽ đi du lịch Đà Nẵng.',
    exampleEn: 'This summer we will travel to Da Nang.',
    memorized: false
  },
  {
    id: 'v11',
    vi: 'Khách sạn',
    en: 'Hotel',
    topic: 'Du lịch (Travel)',
    example: 'Khách sạn này có tầm nhìn hướng biển rất đẹp.',
    exampleEn: 'This hotel has a beautiful ocean view.',
    memorized: false
  }
];

export const DEFAULT_GRAMMAR_PUZZLES: GrammarPuzzle[] = [
  {
    id: 'g1',
    viSentence: 'Tôi là giáo viên tiếng Việt',
    enSentence: 'I am a Vietnamese teacher',
    lesson: 'Bài 1: Giới thiệu bản thân'
  },
  {
    id: 'g2',
    viSentence: 'Hôm nay bạn có khỏe không',
    enSentence: 'Are you healthy / doing well today?',
    lesson: 'Bài 1: Giới thiệu bản thân'
  },
  {
    id: 'g3',
    viSentence: 'Tôi rất thích ăn phở bò',
    enSentence: 'I really like eating beef Pho',
    lesson: 'Bài 2: Ẩm thực đường phố'
  },
  {
    id: 'g4',
    viSentence: 'Bạn muốn uống cà phê sữa đá không',
    enSentence: 'Do you want to drink iced milk coffee?',
    lesson: 'Bài 2: Ẩm thực đường phố'
  },
  {
    id: 'g5',
    viSentence: 'Nhà của tôi ở thành phố Hồ Chí Minh',
    enSentence: 'My house is in Ho Chi Minh City',
    lesson: 'Bài 3: Quê hương của tôi'
  },
  {
    id: 'g6',
    viSentence: 'Thời tiết ngày hôm nay rất đẹp và mát mẻ',
    enSentence: 'The weather today is very beautiful and cool',
    lesson: 'Bài 4: Thời tiết & Khí hậu'
  },
  {
    id: 'g7',
    viSentence: 'Ngày mai tôi sẽ đi du lịch Hà Nội',
    enSentence: 'Tomorrow I will travel to Hanoi',
    lesson: 'Bài 5: Lên kế hoạch du lịch'
  }
];
