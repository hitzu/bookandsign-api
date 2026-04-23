import { SetMetadata } from '@nestjs/common';

export const IS_PHOTOBOOTH_KEY = 'isPhotobooth';
export const Photobooth = () => SetMetadata(IS_PHOTOBOOTH_KEY, true);
