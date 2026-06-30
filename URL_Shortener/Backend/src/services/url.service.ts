import pool from '../db';
import { generateShortCode } from '../utils/shortCode';

const MAX_RETRIES = 5;
const ALIAS_REGEX = /^[a-zA-Z0-9-]{4,32}$/;

interface CreateUrlInput{
    userId: string;
    originalUrl: string;
    customAlias?: string;
    title?: string;
    expiresAt?: string; 
}

export async function createUrl(input: CreateUrlInput){
    const {userId, originalUrl, customAlias, title, expiresAt} = input;

    if(!isValidUrl(originalUrl)){
        throw {status: 400, message: "Invalid url format"}
    }

    let shortCode : string;

    if(customAlias){
        if(!ALIAS_REGEX.test(customAlias)){
            throw {status: 400, message: "Alias must be 4-32 characters, alphanumeric or hyphens only"}
        }

        const existing = await pool.query("select id from urls where short_Code = $1",[customAlias]);

        if(existing.rows.length > 0){
            throw {status: 409, message: "This alias is being already taken"}
        }

        shortCode = customAlias;
    }else{
        shortCode = await generateUniqueShortCode();
    }

    const result = await pool.query(
        `insert into urls (user_id, short_Code, original_url, title, expires_at)
        Values($1, $2, $3, $4, $5)
        Returning id, short_code, original_url, title, expires_at, is_active, created_at`,
        [userId, shortCode, originalUrl, title || null, expiresAt || null]
    );

    return result.rows[0];
}

export async function getUserUrls(userId: string, page: 1, limit: 10){
    const offset = (page - 1) * limit;

    const result = await pool.query(
        `Select id, short_code, original_url, title, expires_at, is_active, created_at, updated_at
        from urls
        where user_id = $1
        order by created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );

    const countResult = await pool.query("select count(*) from urls where user_id = $1", [userId]);

    return { urls: result.rows, total: parseInt(countResult.rows[0].count, 10), page, limit};
}

export async function getUrlById(userId: string, urlId: string){
    const result = await pool.query(`select id, short_code, original_url, title, expires_at, is_active, created_at, updated_at
        from urls where id = $1 and user_id = $2 `,[urlId, userId]
    );

    if(result.rows.length === 0){
        throw {status: 404, message: "Not found"}
    }

    return result.rows[0];
}

export async function updateUrl(userId: string, urlId: string, updates: {title?: string, originalUrl?: string, expiresAt?: string, isActive?: string}){
    await getUrlById(userId, urlId);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if(updates.title !== undefined){
        fields.push(`title = $${idx++}`);
        values.push(updates.title);
    }

    if(updates.originalUrl !== undefined){
        if(!isValidUrl(updates.originalUrl)){
            throw {status: 400, message: 'Invalid url format'}
        }

        fields.push(`original_url = $${idx++}`)
        values.push(updates.originalUrl);
    }

    if(updates.expiresAt !== undefined){
        fields.push(`expires_at = $${idx++}`);
        values.push(updates.expiresAt);
    }

    if(updates.isActive !== undefined){
        fields.push(`is_active = $${idx++}`);
        values.push(updates.isActive);
    }

    if(fields.length === 0){
        throw {status: 400, message: "no fields to update"}
    }

    fields.push(`updated_at = NOW()`);
    values.push(urlId, userId);

    const result = await pool.query(`
        update urls set ${fields.join(', ')}
        WHERE id = $${idx++} AND user_id = $${idx}
        RETURNING id, short_code, original_url, title, expires_at, is_active, created_at, updated_at`, values
    );

    return result.rows[0];
}

export async function deleteUrl(userId: string, urlId: string){
    await getUrlById(userId, urlId);

    await pool.query('delete from urls where id = $1 and user_id = $2', [urlId, userId]);
}

/*
The below function is ran when there is a collision. Like we generate a randow 7 digit short url and if thats already present in
database (for which chances are almost 1 percent) than the below function is called for max of 5 times that generates another 
unique code and checks if that is not present in the database.
*/
async function generateUniqueShortCode(): Promise<string>{
    for (let i = 0; i < MAX_RETRIES; i++) {
        const code = generateShortCode();
        const existing = await pool.query('SELECT id FROM urls WHERE short_code = $1', [code]);
        if (existing.rows.length === 0) {
            return code;
        }
    }

    throw {status:500, message: 'Coulld not generate short code please try again later'}
}

function isValidUrl(url: string) : boolean{
    try{
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    }catch{
        return false;
    }
}