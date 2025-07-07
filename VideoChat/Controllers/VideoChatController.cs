using Microsoft.AspNetCore.Mvc;

namespace VideoChat.Controllers
{
    public class VideoChatController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Room(string roomId = null)
        {
            if (string.IsNullOrEmpty(roomId))
            {
                roomId = Guid.NewGuid().ToString();
                return RedirectToAction("Room", new { roomId = roomId });
            }

            ViewBag.RoomId = roomId;
            return View();
        }
    }
}