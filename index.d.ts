// Type definitions for finteza-sdk
// Project: Finteza
// Definitions by: Vladislav Orlov

import * as e from "express";

/**
 * Create Finteza proxy middleware for Express application
 *
 * @public
 * @param {Object} config                   Config for middleware
 * @param {string} config.path              Proxying path
 * @param {string} config.token             Finteza website token
 * @param {string} [config.url]             Proxy target URL
 * @param {number} [config.timeout=15000]   Timeout for waitting response from Finteza
 * @return {RequestHandler} Express middleware
 */
export function createProxyMiddleware(config: {
    path: string;
    token: string;
    url?: string;
    timeout?: number;
}): e.RequestHandler;

/**
 * Send event to Finteza analytics
 *
 * @public
 * @param {Object} params               Params
 * @param {string} params.name          Event name
 * @param {string} params.websiteId     Website ID in Finteza platform
 * @param {string} [params.url]         Proxy target URL
 * @param {string} [params.token]       Finteza website token (it is requred if you pass params.userIp)
 * @param {string} [params.referer]     Referrer for server events
 * @param {string} [params.backReferer] Back referrer for event
 * @param {string} [params.userIp]      User client IP address for event
 * @param {string} [params.userAgent]   User-Agent for event
 * @param {string} [params.value]       Event value param
 * @param {string} [params.unit]        Unit for value param
 */
export function sendEvent(params: {
    name: string;
    websiteId: string;
    url?: string;
    token?: string;
    referer?: string;
    backReferer?: string;
    userIp?: string;
    userAgent?: string;
    value?: string;
    unit?: string;
}): void;

