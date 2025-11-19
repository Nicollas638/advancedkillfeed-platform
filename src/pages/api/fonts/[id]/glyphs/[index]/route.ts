import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/config/next-auth';
import {db} from '@/lib/db';

export async function PUT(
    req: NextRequest,
    {params}: { params: { id: string; index: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const fontId = params.id;
        const glyphIndex = parseInt(params.index);

        // Get the font
        const font = await db.font.findUnique({
            where: {id: fontId},
            include: {glyphs: true}
        });

        if (!font) {
            return NextResponse.json({error: 'Font not found'}, {status: 404});
        }

        // Verify ownership
        if (font.ownerId !== session.user.id) {
            return NextResponse.json({error: 'You do not have permission to edit this font'}, {status: 403});
        }

        // Validate index
        if (isNaN(glyphIndex) || glyphIndex < 0 || glyphIndex >= font.glyphs.length) {
            return NextResponse.json({error: 'Invalid glyph index'}, {status: 400});
        }

        const {unicode} = await req.json();

        // Update the glyph
        const updatedGlyph = await db.glyph.update({
            where: {id: font.glyphs[glyphIndex].id},
            data: {unicode}
        });

        return NextResponse.json(updatedGlyph);
    } catch (error) {
        console.error('Error updating glyph:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}