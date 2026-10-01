import type {Clip,EditorProject} from './editor-types';
export const captionPresets:{id:string;name:string;description:string;accent:string}[];
export const titlePresets:{id:string;name:string;text:string;description:string}[];
export const transitionPresets:{id:string;name:string}[];
export function estimatedWords(text:string,durationFrames:number):NonNullable<Clip['words']>;
export function captionSettings(preset?:string,accent?:string):NonNullable<Clip['caption']>;
export function captionLayout(sequence:EditorProject['sequence']):Clip['transform'];
export function titleLayout(preset:string,sequence:EditorProject['sequence']):Clip['transform'];
export function transitionAtFrame(clip:Clip,frame:number):{opacity:number;offsetX:number;clipPath:string};
export function textBoxStyle(clip:Clip):Record<string,unknown>;
export function textAtFrame(clip:Clip,frame:number):{text:string;style:Record<string,unknown>;active:boolean;spoken:boolean}[]|null;
export function captionsFromWords(words:unknown[],sequence:EditorProject['sequence'],startFrame?:number,preset?:string,maxWords?:number):unknown[];

export function volumeAtFrame(clip:Clip,frame:number):number;
export function audioAutomation(clip:Clip,fps:number):unknown;
