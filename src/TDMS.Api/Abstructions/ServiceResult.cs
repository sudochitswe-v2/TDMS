using Microsoft.AspNetCore.Http;

namespace TDMS.Api.Abstructions;

public record MessageResponse(string Message);

public class ServiceResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public int StatusCode { get; init; }

    public static ServiceResult Ok() => new() { Success = true, StatusCode = StatusCodes.Status200OK };
    public static ServiceResult NotFound(string error = "Resource not found") => new() { Success = false, Error = error, StatusCode = StatusCodes.Status404NotFound };
    public static ServiceResult BadRequest(string error) => new() { Success = false, Error = error, StatusCode = StatusCodes.Status400BadRequest };
    public static ServiceResult Conflict(string error) => new() { Success = false, Error = error, StatusCode = StatusCodes.Status409Conflict };
    public static ServiceResult Forbid() => new() { Success = false, StatusCode = StatusCodes.Status403Forbidden };
    public static ServiceResult Unauthorized() => new() { Success = false, StatusCode = StatusCodes.Status401Unauthorized };

    public IResult ToHttpResult()
    {
        if (Success) return Results.Ok();
        return StatusCode switch
        {
            StatusCodes.Status400BadRequest => Results.BadRequest(new { error = Error }),
            StatusCodes.Status401Unauthorized => Results.Unauthorized(),
            StatusCodes.Status403Forbidden => Results.Forbid(),
            StatusCodes.Status404NotFound => Results.NotFound(new { error = Error }),
            StatusCodes.Status409Conflict => Results.Conflict(new { error = Error }),
            _ => Results.StatusCode(StatusCode)
        };
    }
}

public class ServiceResult<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public int StatusCode { get; init; }

    public static ServiceResult<T> Ok(T data) => new() { Success = true, Data = data, StatusCode = StatusCodes.Status200OK };
    public static ServiceResult<T> Created(T data) => new() { Success = true, Data = data, StatusCode = StatusCodes.Status201Created };
    public static ServiceResult<T> NotFound(string error = "Resource not found") => new() { Success = false, Error = error, StatusCode = StatusCodes.Status404NotFound };
    public static ServiceResult<T> BadRequest(string error) => new() { Success = false, Error = error, StatusCode = StatusCodes.Status400BadRequest };
    public static ServiceResult<T> Conflict(string error) => new() { Success = false, Error = error, StatusCode = StatusCodes.Status409Conflict };
    public static ServiceResult<T> Forbid() => new() { Success = false, StatusCode = StatusCodes.Status403Forbidden };
    public static ServiceResult<T> Unauthorized() => new() { Success = false, StatusCode = StatusCodes.Status401Unauthorized };

    public IResult ToHttpResult()
    {
        if (Success)
        {
            if (StatusCode == StatusCodes.Status201Created)
            {
                return Results.Json(Data, statusCode: StatusCodes.Status201Created);
            }
            return Data != null ? Results.Ok(Data) : Results.Ok();
        }
        return StatusCode switch
        {
            StatusCodes.Status400BadRequest => Results.BadRequest(new { error = Error }),
            StatusCodes.Status401Unauthorized => Results.Unauthorized(),
            StatusCodes.Status403Forbidden => Results.Forbid(),
            StatusCodes.Status404NotFound => Results.NotFound(new { error = Error }),
            StatusCodes.Status409Conflict => Results.Conflict(new { error = Error }),
            _ => Results.StatusCode(StatusCode)
        };
    }
}
