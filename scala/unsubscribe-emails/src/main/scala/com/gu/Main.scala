package com.gu

import com.amazonaws.services.lambda.runtime.Context

import io.circe.generic.auto._
import io.github.yeghishe.lambda._
import okhttp3._
import net.liftweb.json._

case class User(identityId: String, scGuCookie: String)

case class UnsubscribeResult(status: String)

case class ListId(listId: String)
case class Subscriptions(subscriptions: List[ListId])

class MyHandler extends Handler[User, List[UnsubscribeResult]] {
  implicit val formats = DefaultFormats
  private val client = new OkHttpClient()

  private def unsubscribe(user: User, listId: String): Response = {
    val request = new Request.Builder()
      .url(s"https://idapi.theguardian.com/useremails/${user.identityId}/subscriptions")
      .addHeader("Cookie", s"SC_GU_U=${user.scGuCookie}")
      .addHeader("Referer", "https://theguardian.com")
      .delete(RequestBody.create(MediaType.parse("application/json"), s"""{"listId": "${listId}"}"""))
      .build()
    client.newCall(request).execute()
  }

  private def getAllSubscriptions(user: User): List[ListId] = {
    val request = new Request.Builder()
      .url(s"https://idapi.theguardian.com/useremails/${user.identityId}")
      .addHeader("Referer", "https://theguardian.com")
      .build()
    val response = client.newCall(request).execute()
    val responseBody = response.body().string
    parse(responseBody) \ "result" match {
      case JNothing => throw new RuntimeException(s"Missing 'result' field: $responseBody")
      case resultField => resultField.extract[Subscriptions].subscriptions
    }
  }

  def handler(user: User, context: Context): List[UnsubscribeResult] = {
    val listOfIds = getAllSubscriptions(user)
    logger.info(s"Un-subscribing from: ${listOfIds}")
    listOfIds.map { listId =>
      val response = unsubscribe(user, listId.listId)
      val jsonResponse = parse(response.body().string).extract[UnsubscribeResult]
      jsonResponse
    }

  }
}
