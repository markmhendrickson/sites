import {sql} from 'drizzle-orm';
import {sqliteTable,text,integer,uniqueIndex,index,check} from 'drizzle-orm/sqlite-core';
export const waitlistSignups=sqliteTable('waitlist_signups',{
  id:text('id').primaryKey(),product:text('product').notNull(),email:text('email').notNull(),purpose:text('purpose').notNull(),consentVersion:text('consent_version').notNull(),consent:integer('consent').notNull(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[uniqueIndex('waitlist_product_email').on(t.product,t.email),index('waitlist_signup_expiry').on(t.expiresAt),check('waitlist_product_check',sql`${t.product} IN ('ateles','neotoma')`),check('waitlist_consent_check',sql`${t.consent}=1`)]);
export const waitlistRequests=sqliteTable('waitlist_requests',{
  requestKey:text('request_key').primaryKey(),requestHash:text('request_hash').notNull(),signupId:text('signup_id').notNull().references(()=>waitlistSignups.id,{onDelete:'cascade'}),createdAt:integer('created_at').notNull()
},t=>[index('waitlist_request_signup').on(t.signupId)]);
export const waitlistRateWindows=sqliteTable('waitlist_rate_windows',{
  rateKey:text('rate_key').notNull(),windowStart:integer('window_start').notNull(),attempts:integer('attempts').notNull(),expiresAt:integer('expires_at').notNull()
},t=>[uniqueIndex('waitlist_rate_window').on(t.rateKey,t.windowStart),index('waitlist_rate_expiry').on(t.expiresAt)]);

