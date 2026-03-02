import {NextRequest, NextResponse} from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ path: string[] }> }
) {
    const {path} = await params;
    return handleRequest(request, path, 'GET');
}

export async function POST(
    request: NextRequest,
    {params}: { params: Promise<{ path: string[] }> }
) {
    const {path} = await params;
    return handleRequest(request, path, 'POST');
}

export async function PUT(
    request: NextRequest,
    {params}: { params: Promise<{ path: string[] }> }
) {
    const {path} = await params;
    return handleRequest(request, path, 'PUT');
}

export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ path: string[] }> }
) {
    const {path} = await params;
    return handleRequest(request, path, 'DELETE');
}

async function handleRequest(
    request: NextRequest,
    pathSegments: string[],
    method: string
) {
    try {
        if (!API_BASE_URL) {
            return NextResponse.json(
                {code: 500, msg: '服务端未配置 API_BASE_URL'},
                {status: 500}
            );
        }

        const path = pathSegments.join('/');
        const searchParams = request.nextUrl.searchParams.toString();
        const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, '');
        const url = `${normalizedBaseUrl}/${path}${searchParams ? `?${searchParams}` : ''}`;

        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            if (
                key !== 'host' &&
                key !== 'connection' &&
                key !== 'content-length'
            ) {
                headers[key] = value;
            }
        });

        headers['x-forwarded-host'] = request.headers.get('host') || '';
        headers['x-forwarded-proto'] = request.nextUrl.protocol.replace(':', '');
        headers['x-forwarded-for'] = request.headers.get('x-forwarded-for') || '0.0.0.0';

        const options: RequestInit = {
            method,
            headers,
            cache: 'no-store',
        };

        if (method !== 'GET' && method !== 'HEAD') {
            const body = await request.text();
            if (body) {
                options.body = body;
            }
        }

        const response = await fetch(url, options);
        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
            if (
                key !== 'content-encoding' &&
                key !== 'transfer-encoding' &&
                key !== 'connection'
            ) {
                responseHeaders.set(key, value);
            }
        });

        const body = await response.arrayBuffer();

        return new NextResponse(body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            {code: 500, msg: '代理请求失败'},
            {status: 500}
        );
    }
}
