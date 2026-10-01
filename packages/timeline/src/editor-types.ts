export type Transform={x:number;y:number;width:number;height:number;rotation:number;opacity:number};
export type Keyframe={id:string;frame:number;property:keyof Transform;value:number;easing:'linear'|'easeOut'|'spring'};
export type Clip={id:string;name:string;kind:'video'|'image'|'audio'|'text'|'captions'|'graphics';assetId:string|null;startFrame:number;durationFrames:number;sourceInFrame:number;transform:Transform;text:string;textStyle:{fontSize:number;color:string;background:string;backgroundOpacity:number;align:'left'|'center'|'right';weight:number};animation:{preset:'none'|'fade'|'rise'|'zoom';inFrames:number;outFrames:number};audio:{volume:number;muted:boolean};keyframes:Keyframe[];fit:'contain'|'cover'};
export type Track={id:string;name:string;kind:string;visible:boolean;locked:boolean;muted:boolean;solo:boolean;clips:Clip[]};
export type EditorProject={schemaVersion:3;id:string;name:string;assetIds:string[];sequence:{width:number;height:number;fps:number;durationFrames:number;background:string};renderer:string;tracks:Track[];instructions:unknown[];brandId:string|null};
export type MediaAsset={id:string;name:string;kind:'video'|'image'|'audio';mime:string;hash:string;bytes:number;duration:number|null;width:number|null;height:number|null;hasAudio:boolean;folder:string;tags:string[];source:string};
export type Operation={type:string;[key:string]:unknown};
