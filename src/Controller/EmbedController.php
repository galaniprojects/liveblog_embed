<?php

namespace Drupal\liveblog_embed\Controller;

use Drupal\liveblog\LiveblogRendererInterface;

use Drupal\Core\Controller\ControllerBase;

use Drupal\yaem\Service\EmbedServiceInterface;
use Drupal\yaem\Yaem;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

/**
 * Class EmbedController.
 */
class EmbedController extends ControllerBase {

  /**
   * Embed service.
   *
   * @var EmbedServiceInterface
   */
  protected $embedService;

  /**
   * Ajax renderer service.
   *
   * @var LiveblogRendererInterface
   */
  protected $liveblogRenderer;

  /**
   * EmbedController constructor.
   *
   * @param EmbedServiceInterface $embedService
   *   The service for fetching & rendering embeds.
   * @param LiveblogRendererInterface $liveblogRenderer
   *   The renderer for ajax requests.
   */
  public function __construct(EmbedServiceInterface $embedService, LiveblogRendererInterface $liveblogRenderer) {
    $this->embedService = $embedService;
    $this->liveblogRenderer = $liveblogRenderer;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get(Yaem::YAEM_EMBED_SERVICE),
      $container->get('liveblog.renderer')
    );
  }

  /**
   * Gets an embed for the given url.
   *
   * @param Request $request
   *    The request.
   *
   * @return Response
   *    The http/json response object.
   *    - Response::HTTP_NO_CONTENT if url is not supported.
   *    - JsonResponse with content otherwise.
   */
  public function embed(Request $request) {
    $url = $request->query->get('url');

    $renderer = $this->embedService->getRenderer($url);
    $element = $renderer->render($url);

    if (empty($element)) {
      return new Response('Invalid url: ' . $url, Response::HTTP_NO_CONTENT);
    }

    $data = $this->liveblogRenderer->render($element);
    $data['renderer'] = $renderer->getPluginId();
    return new JsonResponse($data);
  }

}
