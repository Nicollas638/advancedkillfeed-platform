
export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export interface User {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    fonts?: Font[];
    createdAt: Date;
}

export interface Font {
    id: string;
    name: string;
    glyphCount: number;
    ownerId: string;
    createdAt: string;
    owner?: { name?: string };
    url: string;  // <-- URL at which the font file can be fetched
}


export interface Glyph {
    id: string;
    unicode: string;
    svg: string;
    font?: Font;
    fontId: string;
}


export interface FontCreateInput {
    name: string;
    glyphCount?: number;
    glyphs?: GlyphCreateInput[];
}


export interface FontUpdateInput {
    name?: string;
    glyphCount?: number;
    glyphs?: GlyphCreateInput[];
}


export interface GlyphCreateInput {
    unicode: string;
    svg: string;
}


export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}


export interface ExtendedSession {
    user: {
        id: string;
        name?: string | null;
        email: string;
        role: Role;
    };
    expires: string;
}
